import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useProfileCompletion } from "../../hooks/useProfileCompletion";
import { getFieldLabel } from "../../utils/profileValidation";
import userServices from "../../services/userServices";
import gameServices from "../../services/gameServices";
import apiClient from "../../services/apiClient";
import { GENDER_OPTIONS, DEFAULT_VALUES } from "../../constants";
import { GameFormData } from "../Profile/GameForm";
import Select from "react-select";
import "./Onboarding.css";

interface OnboardingState {
  name: string;
  nick_name: string;
  age: number;
  gender: string;
  location: string;
}

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();
  const { isComplete, missingFields, completionPercentage } = useProfileCompletion();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");
  const [availableGames, setAvailableGames] = useState<string[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [showGameForm, setShowGameForm] = useState(false);
  const [gameFormData, setGameFormData] = useState<GameFormData>({
    title: "",
    hours_played: 0,
    image: "",
  });
  const [gameFormErrors, setGameFormErrors] = useState<{
    hoursPlayed?: string;
    repeatedGame?: string;
  }>({});

  const rawgApi = import.meta.env.VITE_RAWG_KEY;

  // Initialize form state from profile if available
  const [formState, setFormState] = useState<OnboardingState>({
    name: store.user?.profile?.name?.trim() || "",
    nick_name: store.user?.profile?.nick_name?.trim() || "",
    age: store.user?.profile?.age || 0,
    gender: store.user?.profile?.gender?.trim() || DEFAULT_VALUES.GENDER_UNDEFINED,
    location: store.user?.profile?.location?.trim() || "",
  });

  // Update form state when profile changes
  useEffect(() => {
    if (store.user?.profile) {
      setFormState({
        name: store.user.profile.name?.trim() || "",
        nick_name: store.user.profile.nick_name?.trim() || "",
        age: store.user.profile.age || 0,
        gender: store.user.profile.gender?.trim() || DEFAULT_VALUES.GENDER_UNDEFINED,
        location: store.user.profile.location?.trim() || "",
      });
    }
  }, [store.user?.profile]);

  // Handle navigation to profile when user clicks continue
  const handleContinueToProfile = () => {
    navigate("/private/profile");
  };

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !store.user) {
      navigate("/");
    }
  }, [navigate, store.user]);

  // Fetch available games
  const fetchGames = useCallback(async () => {
    if (!rawgApi || availableGames.length > 0) return;

    setLoadingGames(true);
    try {
      const pageSize = 40;
      const pages = 5; // Reduced for onboarding
      let allGames: string[] = [];

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      for (let page = 1; page <= pages; page++) {
        try {
          const resp = await fetch(
            `https://api.rawg.io/api/games?key=${rawgApi}&page_size=${pageSize}&page=${page}`,
            {
              method: "GET",
              headers: { Accept: "application/json" },
            }
          );

          if (!resp.ok) {
            if (resp.status === 429) {
              await delay(3000);
              page--;
              continue;
            }
            break;
          }

          const data = await resp.json();
          if (data.results && Array.isArray(data.results)) {
            allGames = allGames.concat(data.results.map((g: { name: string }) => g.name));
          }

          if (!data.next) break;
          if (page < pages) await delay(200);
        } catch (pageError) {
          console.error(`Error on page ${page}:`, pageError);
          await delay(1000);
        }
      }

      setAvailableGames(allGames);
    } catch (err) {
      console.error("Error fetching games:", err);
    } finally {
      setLoadingGames(false);
    }
  }, [rawgApi, availableGames.length]);

  useEffect(() => {
    if (showGameForm && availableGames.length === 0) {
      fetchGames();
    }
  }, [showGameForm, availableGames.length, fetchGames]);

  const gameOptions = useMemo(
    () => availableGames.map((name) => ({ value: name, label: name })),
    [availableGames]
  );

  // Save profile field
  const saveField = useCallback(
    async (field: string, value: string | number) => {
      if (!store.user?.id) return;

      // Skip saving if value is empty string (but allow 0 for age)
      if (field !== "age" && (value === "" || value === null || value === undefined)) {
        return;
      }

      // For age, ensure it's a valid number >= 18
      if (field === "age") {
        const ageNum = typeof value === "number" ? value : Number(value);
        if (isNaN(ageNum) || ageNum < 18) {
          return;
        }
      }

      setIsSaving(true);
      setSaveError("");

      try {
        const updateData: Record<string, string | number> = {};
        // Ensure proper type conversion
        if (field === "age") {
          updateData[field] = Number(value);
        } else {
          // Trim string values
          const stringValue = String(value).trim();
          if (stringValue.length < 2 && field !== "age") {
            return; // Don't save if too short
          }
          updateData[field] = stringValue;
        }

        const response = await apiClient.put(`/api/profiles/${store.user.id}`, updateData, true);

        if (!response.ok) {
          throw new Error("Error saving field");
        }

        // Refresh user info and update store
        const userInfo = await userServices.getUserInfo(0, true);
        if (userInfo && !(userInfo instanceof Error) && userInfo.user) {
          dispatch({ type: "getUserInfo", payload: userInfo.user });
        }
      } catch (err) {
        console.error("Error saving field:", err);
        setSaveError("Error saving. Please try again.");
      } finally {
        setIsSaving(false);
      }
    },
    [store.user?.id, dispatch]
  );

  // Store timeout refs for cleanup
  const saveTimeoutsRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Handle input change with auto-save
  const handleInputChange = useCallback(
    (field: keyof OnboardingState, value: string | number) => {
      setFormState((prev) => ({ ...prev, [field]: value }));

      // Clear previous timeout for this field
      if (saveTimeoutsRef.current[field]) {
        clearTimeout(saveTimeoutsRef.current[field]);
      }

      // Auto-save after a short delay
      saveTimeoutsRef.current[field] = setTimeout(() => {
        saveField(field, value);
        delete saveTimeoutsRef.current[field];
      }, 800);
    },
    [saveField]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = saveTimeoutsRef.current;
    return () => {
      Object.values(timeouts).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Add game
  const handleAddGame = useCallback(async () => {
    if (!store.user?.profile?.id) return;

    setGameFormErrors({});

    // Validate
    if (!gameFormData.title) {
      setGameFormErrors({ repeatedGame: "Please select a game" });
      return;
    }

    if (!gameFormData.hours_played || gameFormData.hours_played <= 0) {
      setGameFormErrors({ hoursPlayed: "Please enter valid hours played" });
      return;
    }

    // Check for duplicate games
    const existingGames = store.user.profile.games || [];
    if (existingGames.some((g) => g.gameTitle === gameFormData.title)) {
      setGameFormErrors({ repeatedGame: "This game is already in your list" });
      return;
    }

    try {
      // Fetch game image from RAWG
      let gameImage = "";
      if (rawgApi) {
        try {
          const searchResp = await fetch(
            `https://api.rawg.io/api/games?key=${rawgApi}&search=${encodeURIComponent(gameFormData.title)}&page_size=1`,
            { headers: { Accept: "application/json" } }
          );
          if (searchResp.ok) {
            const searchData = await searchResp.json();
            if (searchData.results && searchData.results.length > 0) {
              gameImage = searchData.results[0].background_image || "";
            }
          }
        } catch (err) {
          console.warn("Could not fetch game image:", err);
        }
      }

      await gameServices.postNewGame(store.user.profile.id, {
        title: gameFormData.title,
        hours_played: Number(gameFormData.hours_played),
        image: gameImage,
      });

      // Refresh user info and update store
      const userInfo = await userServices.getUserInfo(0, true);
      if (userInfo && !(userInfo instanceof Error) && userInfo.user) {
        dispatch({ type: "getUserInfo", payload: userInfo.user });
      }

      // Reset form
      setGameFormData({ title: "", hours_played: 0, image: "" });
      setShowGameForm(false);
      setGameFormErrors({});
    } catch (err) {
      console.error("Error adding game:", err);
      setGameFormErrors({ repeatedGame: "Error adding game. Please try again." });
    }
  }, [store.user?.profile?.id, store.user?.profile?.games, gameFormData, rawgApi, dispatch]);

  // Get user's games
  const userGames = store.user?.profile?.games || [];

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="onboarding-header">
          <h1 className="onboarding-title">
            <i className="fa-solid fa-rocket" /> Complete Your Profile
          </h1>
          <p className="onboarding-subtitle">
            Complete these fields to unlock all PlayerLink features
          </p>
        </div>

        {/* Progress Bar */}
        <div className="onboarding-progress">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${completionPercentage}%` }} />
          </div>
          <p className="progress-text">
            {completionPercentage}% complete ({6 - missingFields.length}/6 fields)
          </p>
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="onboarding-error">
            <i className="fa-solid fa-exclamation-circle" />
            <p>Error saving. Please try again.</p>
          </div>
        )}

        {/* Missing Fields Indicator */}
        {missingFields.length > 0 && !isComplete && (
          <div className="onboarding-missing">
            <p className="missing-title">Pending fields:</p>
            <ul className="missing-list">
              {missingFields.map((field) => (
                <li key={field}>
                  <i className="fa-solid fa-circle-xmark" />
                  {getFieldLabel(field)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <div className="onboarding-form">
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>

            {/* Name */}
            <div className="form-group">
              <label className={missingFields.includes("name") ? "required" : ""}>
                Name <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Your name"
                maxLength={40}
                className={missingFields.includes("name") ? "error" : ""}
              />
              {missingFields.includes("name") && (
                <span className="field-error">Minimum 2 characters</span>
              )}
            </div>

            {/* Nickname */}
            <div className="form-group">
              <label className={missingFields.includes("nick_name") ? "required" : ""}>
                Nickname <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                value={formState.nick_name}
                onChange={(e) => handleInputChange("nick_name", e.target.value)}
                placeholder="Your nickname"
                maxLength={21}
                className={missingFields.includes("nick_name") ? "error" : ""}
              />
              {missingFields.includes("nick_name") && (
                <span className="field-error">Minimum 2 characters</span>
              )}
            </div>

            {/* Age and Gender */}
            <div className="form-row">
              <div className="form-group">
                <label className={missingFields.includes("age") ? "required" : ""}>
                  Age <span className="required-mark">*</span>
                </label>
                <input
                  type="number"
                  value={formState.age || ""}
                  onChange={(e) => handleInputChange("age", Number(e.target.value))}
                  placeholder="18+"
                  min={18}
                  max={120}
                  className={missingFields.includes("age") ? "error" : ""}
                />
                {missingFields.includes("age") && (
                  <span className="field-error">You must be 18 or older</span>
                )}
              </div>

              <div className="form-group">
                <label className={missingFields.includes("gender") ? "required" : ""}>
                  Gender <span className="required-mark">*</span>
                </label>
                <select
                  value={formState.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className={missingFields.includes("gender") ? "error" : ""}
                >
                  {GENDER_OPTIONS.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
                {missingFields.includes("gender") && (
                  <span className="field-error">Please select a gender</span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label className={missingFields.includes("location") ? "required" : ""}>
                Location <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                value={formState.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Your city or country"
                maxLength={50}
                className={missingFields.includes("location") ? "error" : ""}
              />
              {missingFields.includes("location") && (
                <span className="field-error">Minimum 2 characters</span>
              )}
            </div>
          </div>

          {/* Games Section */}
          <div className="form-section">
            <h3 className="section-title">
              Games <span className="required-mark">*</span>
            </h3>
            <p className="section-description">Add at least one game to your profile</p>

            {/* Games List */}
            {userGames.length > 0 && (
              <div className="games-list">
                {userGames.map((game) => (
                  <div key={game.id} className="game-item">
                    <span className="game-name">{game.gameTitle}</span>
                    <span className="game-hours">{game.gameHoursPlayed}h</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Game Button */}
            <button type="button" className="btn-add-game" onClick={() => setShowGameForm(true)}>
              <i className="fa-solid fa-plus" /> Add Game
            </button>

            {missingFields.includes("games") && (
              <span className="field-error">Add at least one game</span>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="onboarding-actions">
          {isComplete ? (
            <>
              <button type="button" className="btn-continue" onClick={handleContinueToProfile}>
                Next
              </button>
              <p className="help-text">
                Click Next to go to your profile and start using PlayerLink!
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-continue"
                disabled={!isComplete || isSaving}
                onClick={() => navigate("/private/profile")}
              >
                {isSaving ? "Saving..." : "Continue"}
              </button>
              <p className="help-text">
                Fields are saved automatically. Complete all fields marked with * to continue.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Game Form Modal */}
      {showGameForm && (
        <div className="modal-overlay" onClick={() => setShowGameForm(false)}>
          <div className="modal-content onboarding-game-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header onboarding-game-header">
              <div className="onboarding-game-title-wrapper">
                <i className="fa-solid fa-gamepad onboarding-game-icon"></i>
                <h3 className="onboarding-game-title">Add Game</h3>
              </div>
              <button
                type="button"
                className="modal-close onboarding-game-close"
                onClick={() => {
                  setShowGameForm(false);
                  setGameFormErrors({});
                }}
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>
            <div className="modal-body onboarding-game-body">
              <div className="form-group onboarding-game-group">
                <label className="onboarding-game-label">
                  <i className="fa-solid fa-list onboarding-game-label-icon"></i>
                  Select a game
                </label>
                <div className="onboarding-game-select-wrapper">
                  <Select
                    options={gameOptions}
                    value={gameOptions.find((opt) => opt.value === gameFormData.title) || null}
                    onChange={(selected) =>
                      setGameFormData((prev) => ({
                        ...prev,
                        title: selected?.value || "",
                      }))
                    }
                    isSearchable
                    isClearable
                    placeholder="Search for a game..."
                    isLoading={loadingGames}
                    className="onboarding-game-select"
                    classNamePrefix="onboarding-select"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      menu: (base) => ({
                        ...base,
                        background: "linear-gradient(145deg, #0e0e1a, #1a1a2f)",
                        border: "2px solid #7f00ff",
                        borderRadius: "10px",
                        boxShadow:
                          "0 10px 30px rgba(127, 0, 255, 0.4), 0 0 20px rgba(0, 240, 255, 0.2), inset 0 0 20px rgba(127, 0, 255, 0.1)",
                        marginTop: "0.5rem",
                        overflow: "hidden",
                      }),
                      menuList: (base) => ({
                        ...base,
                        padding: "0.5rem",
                        maxHeight: "300px",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "rgba(127, 0, 255, 0.3)"
                          : state.isFocused
                            ? "rgba(0, 240, 255, 0.15)"
                            : "transparent",
                        background: state.isSelected
                          ? "linear-gradient(90deg, rgba(127, 0, 255, 0.3), rgba(0, 240, 255, 0.3))"
                          : undefined,
                        color: state.isSelected || state.isFocused ? "#00f0ff" : "#ffffff",
                        padding: "0.75rem 1rem",
                        cursor: "pointer",
                        borderRadius: "6px",
                        margin: "0.25rem 0",
                        fontWeight: state.isSelected ? 600 : 400,
                        textShadow: state.isFocused ? "0 0 5px rgba(0, 240, 255, 0.5)" : "none",
                        "&:hover": {
                          backgroundColor: "rgba(0, 240, 255, 0.1)",
                          color: "#00f0ff",
                        },
                      }),
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused
                          ? "rgba(0, 0, 0, 0.5)"
                          : "rgba(0, 0, 0, 0.4)",
                        border: "2px solid",
                        borderColor: state.isFocused
                          ? "#00f0ff"
                          : state.isHovered
                            ? "#8f00ff"
                            : "#7f00ff",
                        borderRadius: "10px",
                        boxShadow: state.isFocused
                          ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 240, 255, 0.4), 0 0 25px rgba(0, 240, 255, 0.2)"
                          : state.isHovered
                            ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(143, 0, 255, 0.3)"
                            : "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(127, 0, 255, 0.2)",
                        minHeight: "48px",
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "#8f00ff",
                        },
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "rgba(255, 255, 255, 0.4)",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: "#ffffff",
                        fontWeight: 500,
                      }),
                      input: (base) => ({
                        ...base,
                        color: "#ffffff",
                        caretColor: "#00f0ff",
                      }),
                      indicatorSeparator: (base) => ({
                        ...base,
                        backgroundColor: "rgba(127, 0, 255, 0.3)",
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        color: "#7f00ff",
                        "&:hover": {
                          color: "#00f0ff",
                        },
                      }),
                      clearIndicator: (base) => ({
                        ...base,
                        color: "rgba(255, 107, 107, 0.7)",
                        "&:hover": {
                          color: "#ff6b6b",
                        },
                      }),
                    }}
                  />
                </div>
                {gameFormErrors.repeatedGame && (
                  <div className="onboarding-game-error">
                    <i className="fa-solid fa-exclamation-circle"></i>
                    <span>{gameFormErrors.repeatedGame}</span>
                  </div>
                )}
              </div>
              <div className="form-group onboarding-game-group">
                <label className="onboarding-game-label">
                  <i className="fa-solid fa-clock onboarding-game-label-icon"></i>
                  Hours played
                </label>
                <input
                  type="number"
                  className="onboarding-game-input"
                  value={gameFormData.hours_played || ""}
                  onChange={(e) =>
                    setGameFormData((prev) => ({
                      ...prev,
                      hours_played: Number(e.target.value),
                    }))
                  }
                  placeholder="e.g., 42"
                  min={1}
                  max={10000}
                />
                {gameFormErrors.hoursPlayed && (
                  <div className="onboarding-game-error">
                    <i className="fa-solid fa-exclamation-circle"></i>
                    <span>{gameFormErrors.hoursPlayed}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer onboarding-game-footer">
              <button
                type="button"
                className="btn onboarding-game-btn-cancel"
                onClick={() => {
                  setShowGameForm(false);
                  setGameFormErrors({});
                }}
              >
                <i className="fa-solid fa-times"></i>
                Cancel
              </button>
              <button type="button" className="btn onboarding-game-btn-add" onClick={handleAddGame}>
                <i className="fa-solid fa-plus"></i>
                Add Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
