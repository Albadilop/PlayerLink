import React, { useEffect, useState, useCallback, useRef } from "react";
import "./Settings.css";
import userServices from "../../services/userServices";
import settingsServices, {
  type UserSettings,
  type BlockedUser,
  type MatchingPreferences,
  type PrivacySettings,
  type NotificationPreferences,
  type GamingPreferences,
  type SocialPreferences,
} from "../../services/settingsServices";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import { LanguageModal } from "../../components/ProfileModals/LanguageModal";
import { GamingPreferencesModal } from "../../components/ProfileModals/GamingPreferencesModal";
import { parsePreferences, formatPreferences } from "../../utils/formatters";
import { useTheme } from "../../hooks/useTheme";
import { useAppSounds } from "../../hooks/useAppSounds";
import { useAppAnimations } from "../../hooks/useAppAnimations";
import { useToast } from "../../hooks/useToast";

interface EmailForm {
  actualEmail: string;
  email: string;
  confirmedEmail: string;
  /** Contraseña de la cuenta (obligatoria para solicitar cambio de email). */
  currentPassword: string;
}

interface PasswordForm {
  actualPassword: string;
  password: string;
  confirmedPassword: string;
}

const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();

  // Account modals
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Forms
  const [email, setEmail] = useState<EmailForm>({
    actualEmail: "",
    email: "",
    confirmedEmail: "",
    currentPassword: "",
  });
  const [password, setPassword] = useState<PasswordForm>({
    actualPassword: "",
    password: "",
    confirmedPassword: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [errorPassword, setErrorPassword] = useState<string>("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [correctPassword, setCorrectPassword] = useState<string>("");
  const [sameEmail, setSameEmail] = useState<string>("");
  const [emailChanged, setEmailChanged] = useState<string>("");
  const [errorEmailChange, setErrorEmailChange] = useState<string>("");

  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(false);
  const [settingsError, setSettingsError] = useState<string>("");
  const [settingsSuccess, setSettingsSuccess] = useState<string>("");
  const [ageValidationError, setAgeValidationError] = useState<string>("");

  // Debounce timer for saving age preferences
  const saveAgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState<boolean>(false);
  const [showUnblockModal, setShowUnblockModal] = useState<boolean>(false);
  const [userToUnblock, setUserToUnblock] = useState<number | null>(null);

  const [deleteAccountPassword, setDeleteAccountPassword] = useState<string>("");
  const [errorDeleteAccount, setErrorDeleteAccount] = useState<string>("");

  // App preferences (stored in localStorage)
  const { theme, setTheme } = useTheme();
  const { soundsEnabled, setSoundsEnabled, playSound } = useAppSounds();
  const { animationsEnabled, setAnimationsEnabled } = useAppAnimations();
  const { showToast, ToastContainer } = useToast();

  // Language and Gaming Preferences Modals
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showGamingPreferencesModal, setShowGamingPreferencesModal] = useState<boolean>(false);
  const [selectedGamingPreferences, setSelectedGamingPreferences] = useState<string[]>([]);

  const loadSettings = useCallback(async () => {
    if (!store.user?.id) return;
    setLoadingSettings(true);
    setSettingsError("");
    try {
      const data = await settingsServices.getUserSettings(store.user.id);
      if (data instanceof Error) {
        // Only show error if it's not a connection error (to avoid blocking UI)
        if (data.message.includes("Could not connect")) {
          console.warn("Backend not available, using default settings");
          // Create default settings object for UI
          setSettings({
            id: 0,
            user_id: store.user.id,
            matching: {
              discovery_enabled: true,
              only_common_games: false,
            },
            privacy: {
              profile_visible: true,
              searchable: true,
              show_age: true,
              show_location: true,
              show_hours_played: true,
              show_steam_id: true,
              show_discord: true,
            },
            notifications: {
              email_match_notifications: true,
              email_like_notifications: true,
              email_review_notifications: true,
              email_weekly_summary: false,
              app_sound_notifications: true,
              app_push_notifications: true,
            },
            gaming: {
              steam_sync_enabled: false,
              steam_sync_frequency: "manual",
              show_steam_library: true,
            },
            social: {
              chat_from_matches_only: true,
              read_receipts_enabled: true,
            },
          });
        } else {
          setSettingsError(data.message);
        }
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Don't block UI on connection errors
      if (error instanceof Error && error.message.includes("Could not connect")) {
        console.warn("Backend not available, using default settings");
      } else {
        setSettingsError("Failed to load settings");
      }
    } finally {
      setLoadingSettings(false);
    }
  }, [store.user?.id]);

  const loadBlockedUsers = useCallback(async () => {
    if (!store.user?.id) return;
    setLoadingBlocked(true);
    try {
      const data = await settingsServices.getBlockedUsers(store.user.id);
      if (data instanceof Error) {
        // Don't show error for connection issues, just log it
        if (!data.message.includes("Could not connect")) {
          console.error("Failed to load blocked users:", data);
        }
        setBlockedUsers([]); // Empty array if can't load
      } else {
        setBlockedUsers(data.blocked_users || []);
      }
    } catch (error) {
      console.error("Error loading blocked users:", error);
      setBlockedUsers([]); // Empty array on error
    } finally {
      setLoadingBlocked(false);
    }
  }, [store.user?.id]);

  useEffect(() => {
    if (!store.user) {
      navigate("/");
      return;
    }
    loadSettings();
    loadBlockedUsers();
  }, [navigate, store.user, loadSettings, loadBlockedUsers]);

  // Sync language and gaming preferences with settings
  useEffect(() => {
    if (settings) {
      setSelectedLanguages(parsePreferences(settings.matching.language_preference || null));
      setSelectedGamingPreferences(parsePreferences(settings.matching.gaming_preference || null));
    }
  }, [settings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveAgeTimeoutRef.current) {
        clearTimeout(saveAgeTimeoutRef.current);
      }
    };
  }, []);

  const updateSettings = async (
    updates: Partial<{
      matching: Partial<MatchingPreferences>;
      privacy: Partial<PrivacySettings>;
      notifications: Partial<NotificationPreferences>;
      gaming: Partial<GamingPreferences>;
      social: Partial<SocialPreferences>;
    }>
  ) => {
    if (!store.user?.id || !settings) return;

    setSettingsError("");
    setSettingsSuccess("");

    try {
      const resp = await settingsServices.updateUserSettings(store.user.id, updates);
      if (resp.ok && resp.data) {
        // Use the server response directly - it should contain all saved values
        setSettings(resp.data);
        setSettingsSuccess("Settings updated successfully");
        showToast("Settings updated successfully", "success");
        playSound("success");
        setTimeout(() => setSettingsSuccess(""), 3000);
      } else {
        const errorMsg = resp.error || "Failed to update settings";
        setSettingsError(errorMsg);
        showToast(errorMsg, "error");
        playSound("error");
      }
    } catch {
      setSettingsError("Failed to update settings");
    }
  };

  const handleToggle = (category: string, key: string, value: boolean) => {
    if (!settings) return;
    updateSettings({ [category]: { [key]: value } });
  };

  const validateAgeRange = (minAge: number | null, maxAge: number | null): boolean => {
    if (minAge === null || maxAge === null) {
      setAgeValidationError("");
      return true;
    }
    if (minAge >= maxAge) {
      setAgeValidationError("Min age must be less than max age");
      return false;
    }
    if (minAge < 18) {
      setAgeValidationError("Min age must be at least 18");
      return false;
    }
    if (maxAge > 100) {
      setAgeValidationError("Max age cannot exceed 100");
      return false;
    }
    setAgeValidationError("");
    return true;
  };

  const handleInputChange = (category: string, key: string, value: string | number | null) => {
    if (!settings) return;

    // Update local state immediately to allow user to type
    const updatedSettings = { ...settings };
    if (category === "matching") {
      updatedSettings.matching = { ...settings.matching, [key]: value };
      setSettings(updatedSettings);
    }

    // Validate age range when changing age preferences (but don't block the update)
    if (category === "matching" && (key === "min_age_preference" || key === "max_age_preference")) {
      const newMinAge =
        key === "min_age_preference"
          ? (value as number)
          : updatedSettings.matching.min_age_preference;
      const newMaxAge =
        key === "max_age_preference"
          ? (value as number)
          : updatedSettings.matching.max_age_preference;

      // Validate but allow the update to proceed
      validateAgeRange(newMinAge ?? null, newMaxAge ?? null);

      // Clear existing timeout
      if (saveAgeTimeoutRef.current) {
        clearTimeout(saveAgeTimeoutRef.current);
      }

      // Debounce save to server (wait 500ms after user stops typing)
      saveAgeTimeoutRef.current = setTimeout(() => {
        updateSettings({ [category]: { [key]: value } });
      }, 500);
    } else {
      // For non-age fields, save immediately
      updateSettings({ [category]: { [key]: value } });
    }
  };

  const handleAgeBlur = (category: string, key: string, value: string | number | null) => {
    // Clear any pending timeout
    if (saveAgeTimeoutRef.current) {
      clearTimeout(saveAgeTimeoutRef.current);
      saveAgeTimeoutRef.current = null;
    }
    // Save immediately when user leaves the field
    updateSettings({ [category]: { [key]: value } });
  };

  const handleLanguageSave = () => {
    if (!settings) return;
    const formatted = formatPreferences(selectedLanguages);
    updateSettings({ matching: { language_preference: formatted || null } });
  };

  const handleGamingPreferencesSave = () => {
    if (!settings) return;
    const formatted = formatPreferences(selectedGamingPreferences);
    updateSettings({ matching: { gaming_preference: formatted || null } });
  };

  const handleUnblockClick = (blockedId: number) => {
    setUserToUnblock(blockedId);
    setShowUnblockModal(true);
  };

  const handleUnblockUser = async () => {
    if (!store.user?.id || !userToUnblock) return;
    try {
      const resp = await settingsServices.unblockUser(store.user.id, userToUnblock);
      if (resp.ok) {
        loadBlockedUsers();
        showToast("User unblocked successfully", "success");
        playSound("success");
      } else {
        showToast(resp.error || "Failed to unblock user", "error");
        playSound("error");
      }
    } catch {
      showToast("Failed to unblock user", "error");
      playSound("error");
    } finally {
      setShowUnblockModal(false);
      setUserToUnblock(null);
    }
  };

  const handleExportData = async () => {
    if (!store.user?.id) return;
    try {
      await settingsServices.exportUserData(store.user.id);
      showToast("Data exported successfully", "success");
      playSound("success");
    } catch {
      showToast("Failed to export data", "error");
      playSound("error");
    }
  };

  const submitEmailChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSameEmail("");
    setEmailChanged("");
    setErrorEmailChange("");

    if (email.email !== email.confirmedEmail) {
      setSameEmail("Emails must be the same");
      return;
    }

    const currentNorm = (email.actualEmail || "").trim().toLowerCase();
    const storedNorm = (store.user?.email || "").trim().toLowerCase();
    if (currentNorm !== storedNorm) {
      setSameEmail("Your current email is incorrect");
      return;
    }

    if (!email.currentPassword.trim()) {
      setErrorEmailChange("Please enter your account password.");
      return;
    }

    if (!store.user?.id) {
      setErrorEmailChange("User not found");
      return;
    }

    try {
      const resp = await userServices.requestUserEmailChange(store.user.id, {
        email: email.email.trim(),
        currentPassword: email.currentPassword,
      });
      if (!resp.ok) {
        const err = (resp.error || "").toLowerCase();
        if (err.includes("contraseña") || err.includes("password")) {
          setErrorEmailChange("Current password is incorrect.");
        } else if (err.includes("already exists") || err.includes("duplicate")) {
          setErrorEmailChange("That email is already in use.");
        } else if (err.includes("smtp") || err.includes("confirmation email")) {
          setErrorEmailChange(
            "Could not send the confirmation email. Check server mail configuration."
          );
        } else if (err.includes("different from the current")) {
          setErrorEmailChange("The new email must be different from your current one.");
        } else {
          setErrorEmailChange(resp.error || "Could not start email change. Please try again.");
        }
        return;
      }

      setSameEmail("");
      setErrorEmailChange("");
      setEmailChanged(
        "Confirmation link sent. Check your new inbox (and spam) to finish the change. You can stay logged in until you confirm."
      );

      const refreshed = await userServices.getUserInfo(0, true);
      if (refreshed && !(refreshed instanceof Error) && refreshed.user) {
        await dispatch({ type: "getUserInfo", payload: refreshed.user });
      }

      setTimeout(() => {
        setShowEmailModal(false);
        setEmail({
          actualEmail: "",
          email: "",
          confirmedEmail: "",
          currentPassword: "",
        });
        setEmailChanged("");
      }, 4000);
    } catch {
      setErrorEmailChange("Failed to change the email. Please try again");
    }
  };

  const deleteAccount = async (userId: string | number | undefined) => {
    setErrorDeleteAccount("");
    if (!userId) return;
    const userIdNum = typeof userId === "string" ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) return;

    if (!deleteAccountPassword.trim()) {
      setErrorDeleteAccount("Please enter your account password to confirm.");
      return;
    }

    const resp = await userServices.deleteAccount(userIdNum, deleteAccountPassword);
    if (!resp.ok) {
      const err = (resp.error || "").toLowerCase();
      if (resp.error?.includes("Contraseña") || err.includes("password")) {
        setErrorDeleteAccount("Incorrect password.");
      } else {
        showToast(resp.error || "Failed to delete account", "error");
      }
      return;
    }

    showToast("Account deleted successfully", "success");
    setDeleteAccountPassword("");
    setTimeout(() => {
      setShowDeleteModal(false);
      dispatch({ type: "logout" });
      navigate("/");
    }, 1500);
  };

  const submitPasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorPassword("");
    setCorrectPassword("");

    if (password.actualPassword === password.password) {
      setErrorPassword("Passwords are the same");
      return;
    }
    if (password.password.length <= 0) {
      setErrorPassword("Passwords must contain data");
      return;
    }
    if (password.password !== password.confirmedPassword) {
      setErrorPassword("Passwords do not match");
      return;
    }

    try {
      if (!store.user?.id) {
        setErrorPassword("User not found");
        return;
      }

      const resp = await userServices.changeUserPassword(
        store.user.id,
        password.password,
        password.actualPassword
      );

      if (!resp.ok) {
        setErrorPassword(resp.error || "Error changing password");
        return;
      }

      setCorrectPassword(
        "Password changed successfully. You will receive a confirmation email at your account address."
      );
      setTimeout(() => {
        closeChangePasswordModal();
        dispatch({ type: "logout" });
        navigate("/");
      }, 3000);
    } catch {
      setErrorPassword("Failed to change password. Please try again.");
    }
  };

  const closeChangeEmailModal = () => {
    setShowEmailModal(false);
    setEmail({ actualEmail: "", email: "", confirmedEmail: "", currentPassword: "" });
    setSameEmail("");
    setEmailChanged("");
    setErrorEmailChange("");
  };

  const closeChangePasswordModal = () => {
    setShowPasswordModal(false);
    setShowPassword(false);
    setShowNewPassword(false);
    setPassword({ actualPassword: "", password: "", confirmedPassword: "" });
    setErrorPassword("");
    setCorrectPassword("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name in email) {
      setEmail({ ...email, [name]: value });
    }
    if (name in password) {
      setPassword({ ...password, [name]: value });
    }
  };

  useEffect(() => {
    const errors: string[] = [];
    const pwd = password.password;
    if (pwd.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("an uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("a lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("a number");
    if (!/[^A-Za-z0-9]/.test(pwd)) errors.push("a special character");
    setPasswordErrors(errors);
  }, [password.password]);

  const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({
    checked,
    onChange,
  }) => (
    <label className="settings-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="settings-toggle-slider"></span>
    </label>
  );

  if (loadingSettings) {
    return (
      <div className="settings-container">
        <h2 className="settings-title">Settings</h2>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "20px" }}>
        <h2 className="settings-title" style={{ marginBottom: 0 }}>
          Settings
        </h2>
        {settingsSuccess && (
          <div className="text-success" style={{ margin: 0, fontSize: "1rem" }}>
            {settingsSuccess}
          </div>
        )}
      </div>

      {settingsError && !settingsError.includes("Could not connect") && (
        <div className="text-danger mb-2">{settingsError}</div>
      )}

      {/* Account Section */}
      <div className="settings-category">
        <h3>Account</h3>
        <div className="settings-account-current-mail">
          <span className="settings-account-current-mail__label">Current email</span>
          <span className="settings-account-current-mail__value">
            {store.user?.email?.trim() ? store.user.email : "—"}
          </span>
        </div>
        <div className="settings-section">
          <button
            className="settings-btn"
            onClick={() => {
              setEmail((prev) => ({
                ...prev,
                actualEmail: store.user?.email ?? "",
                currentPassword: "",
              }));
              setShowEmailModal(true);
            }}
          >
            Change Email
          </button>
          <button className="settings-btn" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </button>
        </div>
        {store.user?.pending_email ? (
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "12px", maxWidth: "520px" }}>
            Pending confirmation for:{" "}
            <strong style={{ color: "#00e5ff" }}>{store.user.pending_email}</strong>. Open the link
            we sent to that address to complete the change.
          </p>
        ) : null}
      </div>

      {/* Matching Preferences */}
      {settings && (
        <div className="settings-category settings-category--matching">
          <h3>Matching Preferences</h3>
          <p className="settings-incomplete-note">
            The red option below is saved but Explore still ignores it.
          </p>
          <div className="settings-item settings-item--incomplete">
            <label title="Not applied to Explore / profiles_to_explore yet">Enable Discovery</label>
            <ToggleSwitch
              checked={settings.matching.discovery_enabled ?? true}
              onChange={(val) => handleToggle("matching", "discovery_enabled", val)}
            />
          </div>
          <div className="settings-input-group settings-input-group--matching-age">
            <label>Age Range:</label>
            <div className="settings-matching-age-range">
              <div className="settings-matching-age-field">
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      color: "#aaa",
                      marginBottom: "0.25rem",
                      display: "block",
                    }}
                  >
                    Min Age
                  </label>
                  <input
                    type="number"
                    value={settings.matching.min_age_preference || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "matching",
                        "min_age_preference",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    onBlur={(e) =>
                      handleAgeBlur(
                        "matching",
                        "min_age_preference",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    min="18"
                    max="100"
                    className="settings-age-input"
                  />
                </div>
                <div className="settings-spinner-buttons">
                  <button
                    type="button"
                    className="settings-spinner-btn settings-spinner-up"
                    onClick={() => {
                      const currentValue = settings.matching.min_age_preference || 18;
                      if (currentValue < 100) {
                        const newValue = currentValue + 1;
                        handleInputChange("matching", "min_age_preference", newValue);
                        handleAgeBlur("matching", "min_age_preference", newValue);
                      }
                    }}
                    aria-label="Increase min age"
                  >
                    <i className="fa-solid fa-chevron-up"></i>
                  </button>
                  <button
                    type="button"
                    className="settings-spinner-btn settings-spinner-down"
                    onClick={() => {
                      const currentValue = settings.matching.min_age_preference || 18;
                      if (currentValue > 18) {
                        const newValue = currentValue - 1;
                        handleInputChange("matching", "min_age_preference", newValue);
                        handleAgeBlur("matching", "min_age_preference", newValue);
                      }
                    }}
                    aria-label="Decrease min age"
                  >
                    <i className="fa-solid fa-chevron-down"></i>
                  </button>
                </div>
              </div>
              <div className="settings-matching-age-field">
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      color: "#aaa",
                      marginBottom: "0.25rem",
                      display: "block",
                    }}
                  >
                    Max Age
                  </label>
                  <input
                    type="number"
                    value={settings.matching.max_age_preference || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "matching",
                        "max_age_preference",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    onBlur={(e) =>
                      handleAgeBlur(
                        "matching",
                        "max_age_preference",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    min="18"
                    max="100"
                    className="settings-age-input"
                  />
                </div>
                <div className="settings-spinner-buttons">
                  <button
                    type="button"
                    className="settings-spinner-btn settings-spinner-up"
                    onClick={() => {
                      const currentValue = settings.matching.max_age_preference || 18;
                      if (currentValue < 100) {
                        const newValue = currentValue + 1;
                        handleInputChange("matching", "max_age_preference", newValue);
                        handleAgeBlur("matching", "max_age_preference", newValue);
                      }
                    }}
                    aria-label="Increase max age"
                  >
                    <i className="fa-solid fa-chevron-up"></i>
                  </button>
                  <button
                    type="button"
                    className="settings-spinner-btn settings-spinner-down"
                    onClick={() => {
                      const currentValue = settings.matching.max_age_preference || 18;
                      if (currentValue > 18) {
                        const newValue = currentValue - 1;
                        handleInputChange("matching", "max_age_preference", newValue);
                        handleAgeBlur("matching", "max_age_preference", newValue);
                      }
                    }}
                    aria-label="Decrease max age"
                  >
                    <i className="fa-solid fa-chevron-down"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {ageValidationError && (
            <div className="text-danger" style={{ fontSize: "0.9rem", marginTop: "5px" }}>
              {ageValidationError}
            </div>
          )}
          <div className="settings-input-group">
            <label>Gender Preference:</label>
            <select
              value={settings.matching.gender_preference || ""}
              onChange={(e) =>
                handleInputChange("matching", "gender_preference", e.target.value || null)
              }
            >
              <option value="">Any</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="settings-input-group">
            <label>Language Preference:</label>
            <button
              className="settings-btn"
              onClick={() => setShowLanguageModal(true)}
              type="button"
            >
              {selectedLanguages.length > 0
                ? `${selectedLanguages.length} language${selectedLanguages.length > 1 ? "s" : ""} selected`
                : "Select Languages"}
            </button>
          </div>
          <div className="settings-input-group">
            <label>Gaming Preference:</label>
            <button
              className="settings-btn"
              onClick={() => setShowGamingPreferencesModal(true)}
              type="button"
            >
              {selectedGamingPreferences.length > 0
                ? `${selectedGamingPreferences.length} preference${selectedGamingPreferences.length > 1 ? "s" : ""} selected`
                : "Select Gaming Preferences"}
            </button>
          </div>
          <div className="settings-item">
            <label>Only Common Games</label>
            <ToggleSwitch
              checked={settings.matching.only_common_games ?? false}
              onChange={(val) => handleToggle("matching", "only_common_games", val)}
            />
          </div>
          <div className="settings-input-group">
            <label>Min Hours Played:</label>
            <div className="settings-matching-hours-row">
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  value={settings.matching.min_hours_played || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "matching",
                      "min_hours_played",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  min="0"
                  className="settings-age-input"
                />
              </div>
              <div className="settings-spinner-buttons">
                <button
                  type="button"
                  className="settings-spinner-btn settings-spinner-up"
                  onClick={() => {
                    const currentValue = settings.matching.min_hours_played || 0;
                    handleInputChange("matching", "min_hours_played", currentValue + 1);
                  }}
                  aria-label="Increase min hours"
                >
                  <i className="fa-solid fa-chevron-up"></i>
                </button>
                <button
                  type="button"
                  className="settings-spinner-btn settings-spinner-down"
                  onClick={() => {
                    const currentValue = settings.matching.min_hours_played || 0;
                    if (currentValue > 0) {
                      handleInputChange("matching", "min_hours_played", currentValue - 1);
                    }
                  }}
                  aria-label="Decrease min hours"
                >
                  <i className="fa-solid fa-chevron-down"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      {settings && (
        <div className="settings-category">
          <h3>Privacy</h3>
          <div className="settings-item">
            <label>Profile Visible</label>
            <ToggleSwitch
              checked={settings.privacy.profile_visible ?? true}
              onChange={(val) => handleToggle("privacy", "profile_visible", val)}
            />
          </div>
          <div className="settings-item">
            <label>Searchable</label>
            <ToggleSwitch
              checked={settings.privacy.searchable ?? true}
              onChange={(val) => handleToggle("privacy", "searchable", val)}
            />
          </div>
          <div className="settings-item">
            <label>Show Age</label>
            <ToggleSwitch
              checked={settings.privacy.show_age ?? true}
              onChange={(val) => handleToggle("privacy", "show_age", val)}
            />
          </div>
          <div className="settings-item">
            <label>Show Location</label>
            <ToggleSwitch
              checked={settings.privacy.show_location ?? true}
              onChange={(val) => handleToggle("privacy", "show_location", val)}
            />
          </div>
          <div className="settings-item">
            <label>Show Hours Played</label>
            <ToggleSwitch
              checked={settings.privacy.show_hours_played ?? true}
              onChange={(val) => handleToggle("privacy", "show_hours_played", val)}
            />
          </div>
          <div className="settings-item">
            <label>Show Steam ID</label>
            <ToggleSwitch
              checked={settings.privacy.show_steam_id ?? true}
              onChange={(val) => handleToggle("privacy", "show_steam_id", val)}
            />
          </div>
          <div className="settings-item">
            <label>Show Discord</label>
            <ToggleSwitch
              checked={settings.privacy.show_discord ?? true}
              onChange={(val) => handleToggle("privacy", "show_discord", val)}
            />
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      {settings && (
        <div className="settings-category">
          <h3>Notifications</h3>
          <p className="settings-incomplete-note">
            Email and server-side app toggles are stored but not connected to sending logic or push
            across the app. Application → Sounds uses local preferences instead.
          </p>
          <div className="settings-item settings-item--incomplete">
            <label>Email: Match Notifications</label>
            <ToggleSwitch
              checked={settings.notifications.email_match_notifications ?? true}
              onChange={(val) => handleToggle("notifications", "email_match_notifications", val)}
            />
          </div>
          <div className="settings-item settings-item--incomplete">
            <label>Email: Like Notifications</label>
            <ToggleSwitch
              checked={settings.notifications.email_like_notifications ?? true}
              onChange={(val) => handleToggle("notifications", "email_like_notifications", val)}
            />
          </div>
          <div className="settings-item settings-item--incomplete">
            <label>Email: Review Notifications</label>
            <ToggleSwitch
              checked={settings.notifications.email_review_notifications ?? true}
              onChange={(val) => handleToggle("notifications", "email_review_notifications", val)}
            />
          </div>
          <div className="settings-item settings-item--incomplete">
            <label>Email: Weekly Summary</label>
            <ToggleSwitch
              checked={settings.notifications.email_weekly_summary ?? false}
              onChange={(val) => handleToggle("notifications", "email_weekly_summary", val)}
            />
          </div>
          <div className="settings-item settings-item--incomplete">
            <label>App: Sound Notifications</label>
            <ToggleSwitch
              checked={settings.notifications.app_sound_notifications ?? true}
              onChange={(val) => handleToggle("notifications", "app_sound_notifications", val)}
            />
          </div>
          <div className="settings-item settings-item--incomplete">
            <label>App: Push Notifications</label>
            <ToggleSwitch
              checked={settings.notifications.app_push_notifications ?? true}
              onChange={(val) => handleToggle("notifications", "app_push_notifications", val)}
            />
          </div>
        </div>
      )}

      {/* Gaming Preferences */}
      {settings && (
        <div className="settings-category settings-category--gaming">
          <h3>Gaming</h3>
          <p className="settings-incomplete-note">
            No Steam sync job uses these flags yet; library visibility is not wired in the UI.
          </p>
          <div className="settings-item settings-item--incomplete">
            <label>Steam Sync Enabled</label>
            <ToggleSwitch
              checked={settings.gaming.steam_sync_enabled ?? false}
              onChange={(val) => handleToggle("gaming", "steam_sync_enabled", val)}
            />
          </div>
          <div className="settings-input-group settings-input-group--gaming-sync settings-input-group--incomplete">
            <label>Sync Frequency:</label>
            <select
              value={settings.gaming.steam_sync_frequency || "manual"}
              onChange={(e) => handleInputChange("gaming", "steam_sync_frequency", e.target.value)}
            >
              <option value="manual">Manual</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="settings-item settings-item--incomplete">
            <label>Show Steam Library</label>
            <ToggleSwitch
              checked={settings.gaming.show_steam_library ?? true}
              onChange={(val) => handleToggle("gaming", "show_steam_library", val)}
            />
          </div>
        </div>
      )}

      {/* Social Preferences */}
      {settings && (
        <div className="settings-category">
          <h3>Social</h3>
          <p className="settings-incomplete-note">
            Chat does not read these flags yet; values are only stored in your account settings.
          </p>
          <div className="settings-item settings-item--incomplete">
            <label>Chat from Matches Only</label>
            <ToggleSwitch
              checked={settings.social.chat_from_matches_only ?? true}
              onChange={(val) => handleToggle("social", "chat_from_matches_only", val)}
            />
          </div>
          <div className="settings-item settings-item--incomplete">
            <label>Read Receipts</label>
            <ToggleSwitch
              checked={settings.social.read_receipts_enabled ?? true}
              onChange={(val) => handleToggle("social", "read_receipts_enabled", val)}
            />
          </div>
        </div>
      )}

      {/* Blocked Users */}
      <div className="settings-category">
        <h3>Blocked Users</h3>
        <p className="settings-incomplete-note">
          You cannot add new blocks from this page (no block UI here). Block someone from their
          profile; you can only unblock from this list.
        </p>
        {loadingBlocked ? (
          <p>Loading blocked users...</p>
        ) : blockedUsers.length === 0 ? (
          <p>No blocked users</p>
        ) : (
          blockedUsers.map((blocked) => (
            <div key={blocked.id} className="blocked-user-item">
              <div className="blocked-user-info">
                {blocked.blocked_user?.photo && (
                  <img src={blocked.blocked_user.photo} alt={blocked.blocked_user.nick_name} />
                )}
                <div>
                  <div>{blocked.blocked_user?.nick_name || `User #${blocked.blocked_id}`}</div>
                  {blocked.reason && <small>{blocked.reason}</small>}
                </div>
              </div>
              <button
                className="settings-btn"
                onClick={() => handleUnblockClick(blocked.blocked_id)}
              >
                Unblock
              </button>
            </div>
          ))
        )}
      </div>

      {/* App Preferences */}
      <div className="settings-category settings-category--application">
        <h3>Application</h3>
        <div className="settings-input-group settings-input-group--application-theme">
          <label>Theme</label>
          <select
            value={theme}
            onChange={(e) => {
              setTheme(e.target.value as "dark" | "light");
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div className="settings-item">
          <label>Sounds</label>
          <ToggleSwitch
            checked={soundsEnabled}
            onChange={(val) => {
              setSoundsEnabled(val);
              if (val) playSound("click");
            }}
          />
        </div>
        <div className="settings-item">
          <label>Animations</label>
          <ToggleSwitch
            checked={animationsEnabled}
            onChange={(val) => {
              setAnimationsEnabled(val);
              if (soundsEnabled) playSound("click");
            }}
          />
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="settings-category">
        <h3>Data & Privacy</h3>
        <button className="export-btn" onClick={handleExportData}>
          Export My Data
        </button>
        <p style={{ fontSize: "0.9rem", marginTop: "10px", color: "#aaa" }}>
          Download all your data in JSON format (GDPR compliant)
        </p>
        <p className="settings-incomplete-note" style={{ marginTop: "8px" }}>
          The JSON always includes this app&apos;s database. When the server has Supabase Admin
          configured, the export also adds <code>supabase_auth</code> (Auth snapshot) if your
          account is linked or can be matched by email. Storage-only assets are not listed here.
        </p>
      </div>

      {/* Delete Account */}
      <div className="settings-warning">
        <h3>Delete Account</h3>
        <p>
          If you delete your account, your profile and app data are removed immediately. This cannot
          be undone.
        </p>
        <div className="warning-buttons">
          <button
            className="delete-btn"
            onClick={() => {
              setDeleteAccountPassword("");
              setErrorDeleteAccount("");
              setShowDeleteModal(true);
            }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Modals */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Change Email</h3>
            <form onSubmit={submitEmailChange}>
              <input
                type="email"
                placeholder="Current Email"
                name="actualEmail"
                value={email.actualEmail}
                onChange={handleChange}
              />
              <input
                type="email"
                placeholder="New Email"
                name="email"
                value={email.email}
                onChange={handleChange}
              />
              <input
                type="email"
                placeholder="Confirm New Email"
                name="confirmedEmail"
                value={email.confirmedEmail}
                onChange={handleChange}
              />
              <input
                type="password"
                placeholder="Account password (required)"
                name="currentPassword"
                value={email.currentPassword}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ marginTop: "10px" }}
              />
              {sameEmail && <h6 className="text-danger mt-1">{sameEmail}</h6>}
              {emailChanged && <h6 className="text-success mt-1">{emailChanged}</h6>}
              {errorEmailChange && <h6 className="text-danger mt-1">{errorEmailChange}</h6>}
              <div className="modal-actions">
                <button type="button" onClick={closeChangeEmailModal}>
                  Cancel
                </button>
                <button type="submit" className="confirm-btn">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Change Password</h3>
            <form onSubmit={submitPasswordChange}>
              <div className="d-flex">
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Actual Password"
                    name="actualPassword"
                    value={password.actualPassword}
                    className="settings-change-password-input"
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <i
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={`fa-solid setting-change-password-eye-icon ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    style={{ cursor: "pointer" }}
                  ></i>
                </div>
              </div>
              <div className="d-flex">
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    name="password"
                    value={password.password}
                    className="settings-change-password-input"
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <i
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className={`fa-solid setting-change-password-eye-icon ${showNewPassword ? "fa-eye-slash" : "fa-eye"}`}
                    style={{ cursor: "pointer" }}
                  ></i>
                </div>
              </div>
              {passwordErrors.length > 0 && (
                <h5 className="text-warning mt-2 register-message-errors">
                  Password must contain {passwordErrors.join(", ")}.
                </h5>
              )}
              <input
                type="password"
                placeholder="Confirm New Password"
                name="confirmedPassword"
                value={password.confirmedPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errorPassword && <h6 className="text-danger mt-1">{errorPassword}</h6>}
              {correctPassword && <h6 className="text-success mt-1">{correctPassword}</h6>}
              <div className="modal-actions">
                <button type="button" onClick={closeChangePasswordModal}>
                  Cancel
                </button>
                <button type="submit" className="confirm-btn">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box small">
            <h3>Are you sure?</h3>
            <p>
              This action cannot be undone. Your account and associated data will be deleted
              immediately.
            </p>
            <input
              type="password"
              placeholder="Account password (required)"
              value={deleteAccountPassword}
              onChange={(e) => setDeleteAccountPassword(e.target.value)}
              autoComplete="current-password"
              style={{ width: "100%", marginTop: "12px", padding: "8px", boxSizing: "border-box" }}
            />
            {errorDeleteAccount && <h6 className="text-danger mt-2">{errorDeleteAccount}</h6>}
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteAccountPassword("");
                  setErrorDeleteAccount("");
                }}
              >
                Cancel
              </button>
              <button className="confirm-btn" onClick={() => deleteAccount(store.user?.id)}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnblockModal && (
        <div className="modal-overlay">
          <div className="modal-box small">
            <h3>Unblock User?</h3>
            <p>
              Are you sure you want to unblock this user? They will be able to see your profile
              again.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowUnblockModal(false);
                  setUserToUnblock(null);
                }}
              >
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleUnblockUser}>
                Unblock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Preference Modal */}
      {showLanguageModal && (
        <LanguageModal
          selected={selectedLanguages}
          setSelected={setSelectedLanguages}
          onSave={handleLanguageSave}
          onCancel={() => setShowLanguageModal(false)}
        />
      )}

      {/* Gaming Preferences Modal */}
      {showGamingPreferencesModal && (
        <GamingPreferencesModal
          selected={selectedGamingPreferences}
          setSelected={setSelectedGamingPreferences}
          onSave={handleGamingPreferencesSave}
          onCancel={() => setShowGamingPreferencesModal(false)}
        />
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default SettingsView;
