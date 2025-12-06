import React, { useEffect, useState, useCallback } from "react";
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

interface EmailForm {
  actualEmail: string;
  email: string;
  confirmedEmail: string;
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

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState<boolean>(false);

  // App preferences (stored in localStorage)
  const [appTheme, setAppTheme] = useState<string>(localStorage.getItem("appTheme") || "dark");
  const [appSounds, setAppSounds] = useState<boolean>(
    localStorage.getItem("appSounds") !== "false"
  );
  const [appAnimations, setAppAnimations] = useState<boolean>(
    localStorage.getItem("appAnimations") !== "false"
  );

  const loadSettings = useCallback(async () => {
    if (!store.user?.id) return;
    setLoadingSettings(true);
    setSettingsError("");
    try {
      const data = await settingsServices.getUserSettings(store.user.id);
      if (data instanceof Error) {
        setSettingsError(data.message);
      } else {
        setSettings(data);
      }
    } catch {
      setSettingsError("Failed to load settings");
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
        console.error("Failed to load blocked users:", data);
      } else {
        setBlockedUsers(data.blocked_users || []);
      }
    } catch (error) {
      console.error("Error loading blocked users:", error);
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
        setSettings(resp.data);
        setSettingsSuccess("Settings updated successfully");
        setTimeout(() => setSettingsSuccess(""), 3000);
      } else {
        setSettingsError(resp.error || "Failed to update settings");
      }
    } catch {
      setSettingsError("Failed to update settings");
    }
  };

  const handleToggle = (category: string, key: string, value: boolean) => {
    if (!settings) return;
    updateSettings({ [category]: { [key]: value } });
  };

  const handleInputChange = (category: string, key: string, value: string | number | null) => {
    if (!settings) return;
    updateSettings({ [category]: { [key]: value } });
  };

  // Function available for future use (e.g., blocking from user profile)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBlockUser = async (blockedId: number, reason?: string) => {
    if (!store.user?.id) return;
    try {
      const resp = await settingsServices.blockUser(store.user.id, blockedId, reason);
      if (resp.ok) {
        loadBlockedUsers();
        alert("User blocked successfully");
      } else {
        alert(resp.error || "Failed to block user");
      }
    } catch {
      alert("Failed to block user");
    }
  };

  const handleUnblockUser = async (blockedId: number) => {
    if (!store.user?.id) return;
    try {
      const resp = await settingsServices.unblockUser(store.user.id, blockedId);
      if (resp.ok) {
        loadBlockedUsers();
        alert("User unblocked successfully");
      } else {
        alert(resp.error || "Failed to unblock user");
      }
    } catch {
      alert("Failed to unblock user");
    }
  };

  const handleExportData = async () => {
    if (!store.user?.id) return;
    try {
      await settingsServices.exportUserData(store.user.id);
      alert("Data exported successfully");
    } catch {
      alert("Failed to export data");
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

    if (email.actualEmail !== (store.user?.email || "")) {
      setSameEmail("Your current email is incorrect");
      return;
    }

    if (!store.user?.id) {
      setErrorEmailChange("User not found");
      return;
    }

    try {
      const resp = await userServices.changeUserEmail(store.user.id, email.email);
      if (!resp.ok) {
        setErrorEmailChange("Something happened, looks like this email already exists");
        return;
      }

      setSameEmail("");
      setErrorEmailChange("");
      setEmailChanged("Email updated successfully");

      setTimeout(() => {
        setShowEmailModal(false);
        setEmail({ actualEmail: "", email: "", confirmedEmail: "" });
        setEmailChanged("");
        dispatch({ type: "logout" });
        navigate("/");
      }, 3000);
    } catch {
      setErrorEmailChange("Failed to change the email. Please try again");
    }
  };

  const deleteAccount = async (userId: string | number | undefined) => {
    if (!userId) return;
    const userIdNum = typeof userId === "string" ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) return;

    const resp = await userServices.deleteAccount(userIdNum);
    if (!resp.ok) {
      alert(resp.error || "Failed to delete account");
      return;
    }

    alert("Account deleted successfully");
    setTimeout(() => {
      setShowDeleteModal(false);
      dispatch({ type: "logout" });
      navigate("/");
    }, 3000);
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

      setCorrectPassword("Password changed successfully");
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
    setEmail({ actualEmail: "", email: "", confirmedEmail: "" });
    setSameEmail("");
    setEmailChanged("");
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
      <h2 className="settings-title">Settings</h2>

      {settingsError && <div className="text-danger mb-2">{settingsError}</div>}
      {settingsSuccess && <div className="text-success mb-2">{settingsSuccess}</div>}

      {/* Account Section */}
      <div className="settings-category">
        <h3>Account</h3>
        <div className="settings-section">
          <button className="settings-btn" onClick={() => setShowEmailModal(true)}>
            Change Email
          </button>
          <button className="settings-btn" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </button>
        </div>
      </div>

      {/* Matching Preferences */}
      {settings && (
        <div className="settings-category">
          <h3>Matching Preferences</h3>
          <div className="settings-item">
            <label>Enable Discovery</label>
            <ToggleSwitch
              checked={settings.matching.discovery_enabled ?? true}
              onChange={(val) => handleToggle("matching", "discovery_enabled", val)}
            />
          </div>
          <div className="settings-input-group">
            <label>Min Age:</label>
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
              min="18"
              max="100"
            />
          </div>
          <div className="settings-input-group">
            <label>Max Age:</label>
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
              min="18"
              max="100"
            />
          </div>
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
          <div className="settings-item">
            <label>Only Common Games</label>
            <ToggleSwitch
              checked={settings.matching.only_common_games ?? false}
              onChange={(val) => handleToggle("matching", "only_common_games", val)}
            />
          </div>
          <div className="settings-input-group">
            <label>Min Hours Played:</label>
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
            />
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
          <div className="settings-item">
            <label>Email: Match Notifications</label>
            <ToggleSwitch
              checked={settings.notifications.email_match_notifications ?? true}
              onChange={(val) => handleToggle("notifications", "email_match_notifications", val)}
            />
          </div>
          <div className="settings-item">
            <label>Email: Like Notifications</label>
            <ToggleSwitch
              checked={settings.notifications.email_like_notifications ?? true}
              onChange={(val) => handleToggle("notifications", "email_like_notifications", val)}
            />
          </div>
          <div className="settings-item">
            <label>Email: Review Notifications</label>
            <ToggleSwitch
              checked={settings.notifications.email_review_notifications ?? true}
              onChange={(val) => handleToggle("notifications", "email_review_notifications", val)}
            />
          </div>
          <div className="settings-item">
            <label>Email: Weekly Summary</label>
            <ToggleSwitch
              checked={settings.notifications.email_weekly_summary ?? false}
              onChange={(val) => handleToggle("notifications", "email_weekly_summary", val)}
            />
          </div>
          <div className="settings-item">
            <label>App: Sound Notifications</label>
            <ToggleSwitch
              checked={settings.notifications.app_sound_notifications ?? true}
              onChange={(val) => handleToggle("notifications", "app_sound_notifications", val)}
            />
          </div>
          <div className="settings-item">
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
        <div className="settings-category">
          <h3>Gaming</h3>
          <div className="settings-item">
            <label>Steam Sync Enabled</label>
            <ToggleSwitch
              checked={settings.gaming.steam_sync_enabled ?? false}
              onChange={(val) => handleToggle("gaming", "steam_sync_enabled", val)}
            />
          </div>
          <div className="settings-input-group">
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
          <div className="settings-item">
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
          <div className="settings-item">
            <label>Chat from Matches Only</label>
            <ToggleSwitch
              checked={settings.social.chat_from_matches_only ?? true}
              onChange={(val) => handleToggle("social", "chat_from_matches_only", val)}
            />
          </div>
          <div className="settings-item">
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
                onClick={() => handleUnblockUser(blocked.blocked_id)}
              >
                Unblock
              </button>
            </div>
          ))
        )}
      </div>

      {/* App Preferences */}
      <div className="settings-category">
        <h3>Application</h3>
        <div className="settings-item">
          <label>Theme</label>
          <select
            value={appTheme}
            onChange={(e) => {
              setAppTheme(e.target.value);
              localStorage.setItem("appTheme", e.target.value);
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div className="settings-item">
          <label>Sounds</label>
          <ToggleSwitch
            checked={appSounds}
            onChange={(val) => {
              setAppSounds(val);
              localStorage.setItem("appSounds", val.toString());
            }}
          />
        </div>
        <div className="settings-item">
          <label>Animations</label>
          <ToggleSwitch
            checked={appAnimations}
            onChange={(val) => {
              setAppAnimations(val);
              localStorage.setItem("appAnimations", val.toString());
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
      </div>

      {/* Delete Account */}
      <div className="settings-warning">
        <h3>Delete Account</h3>
        <p>If you delete your account, all your data will be permanently erased after 30 days.</p>
        <div className="warning-buttons">
          <button className="delete-btn" onClick={() => setShowDeleteModal(true)}>
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
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)}>No</button>
              <button className="confirm-btn" onClick={() => deleteAccount(store.user?.id)}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
