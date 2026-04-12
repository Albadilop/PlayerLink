import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { getFieldLabel } from "../../utils/profileValidation";
import userServices from "../../services/userServices";
import gameServices from "../../services/gameServices";
import apiClient from "../../services/apiClient";
import { GENDER_OPTIONS, DEFAULT_VALUES, PROFILE_FIELD_LIMITS } from "../../constants";
import { clampProfileLocation } from "../../utils/profileValidation";
import { AddGameModal, type GameFormData } from "../Modals/AddGameModal";
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
    location: clampProfileLocation(store.user?.profile?.location?.trim() || ""),
  });

  // Hidratar desde el store una sola vez por par (user id, profile id). Tras el autoguardado,
  // getUserInfo sustituye `profile` en el store y, si re-sincronizábamos en cada cambio, se
  // machacaba el texto en curso (parecía que la página se refrescaba al escribir nombre/nick).
  const hydratedFormKeyRef = React.useRef<string | null>(null);
  useEffect(() => {
    const uid = store.user?.id;
    const profile = store.user?.profile;
    if (uid == null || profile == null) return;
    const key = `${uid}:${profile.id}`;
    if (hydratedFormKeyRef.current === key) return;
    setFormState({
      name: profile.name?.trim() || "",
      nick_name: profile.nick_name?.trim() || "",
      age: profile.age || 0,
      gender: profile.gender?.trim() || DEFAULT_VALUES.GENDER_UNDEFINED,
      location: clampProfileLocation(profile.location?.trim() || ""),
    });
    hydratedFormKeyRef.current = key;
  }, [store.user?.id, store.user?.profile]);

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

      setIsSaving(true);
      setSaveError("");

      try {
        const updateData: Record<string, string | number | null> = {};

        // Handle age field
        if (field === "age") {
          const ageNum = typeof value === "number" ? value : Number(value);
          // Save 0 or null if age is invalid, so backend knows it's incomplete
          if (isNaN(ageNum) || ageNum < 18) {
            updateData[field] = 0; // Set to 0 to indicate incomplete
          } else {
            updateData[field] = ageNum;
          }
        } else {
          // Handle string fields - save empty string if cleared
          let stringValue = String(value).trim();
          if (field === "location") {
            stringValue = clampProfileLocation(stringValue);
          }
          // Save empty string if field is cleared, so backend knows it's incomplete
          updateData[field] = stringValue || "";
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
      const next: string | number =
        field === "location" && typeof value === "string" ? clampProfileLocation(value) : value;
      setFormState((prev) => ({ ...prev, [field]: next }));

      // Clear previous timeout for this field
      if (saveTimeoutsRef.current[field]) {
        clearTimeout(saveTimeoutsRef.current[field]);
      }

      // Auto-save after a short delay
      saveTimeoutsRef.current[field] = setTimeout(() => {
        saveField(field, next);
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

  // Delete game
  const handleDeleteGame = useCallback(
    async (gameId: number) => {
      if (!store.user?.profile?.id) return;

      try {
        // Optimistic update - remove game from store immediately
        if (store.user?.profile?.games) {
          const updatedGames = store.user.profile.games.filter((game) => game.id !== gameId);
          const updatedUser = {
            ...store.user,
            profile: {
              ...store.user.profile,
              games: updatedGames,
            },
          };
          dispatch({ type: "getUserInfo", payload: updatedUser });
        }

        // Delete from backend
        await gameServices.deleteGameById(gameId);

        // Refresh user info to ensure consistency
        const userInfo = await userServices.getUserInfo(0, true);
        if (userInfo && !(userInfo instanceof Error) && userInfo.user) {
          dispatch({ type: "getUserInfo", payload: userInfo.user });
        }
      } catch (err) {
        console.error("Error deleting game:", err);
        // Revert optimistic update on error
        const userInfo = await userServices.getUserInfo(0, true);
        if (userInfo && !(userInfo instanceof Error) && userInfo.user) {
          dispatch({ type: "getUserInfo", payload: userInfo.user });
        }
      }
    },
    [store.user, dispatch]
  );

  // Add game
  const handleAddGame = useCallback(async () => {
    if (!store.user?.profile?.id) return;

    setGameFormErrors({});

    // Validate
    if (!gameFormData.title) {
      setGameFormErrors({ repeatedGame: "Please select a game" });
      return;
    }

    const hoursPlayedNum =
      typeof gameFormData.hours_played === "number"
        ? gameFormData.hours_played
        : Number(gameFormData.hours_played);

    if (!hoursPlayedNum || hoursPlayedNum <= 0) {
      setGameFormErrors({ hoursPlayed: "Please enter valid hours played" });
      return;
    }

    // Check for duplicate games - case insensitive comparison
    const existingGames = store.user.profile.games || [];
    const gameTitleLower = gameFormData.title.toLowerCase().trim();
    if (existingGames.some((g) => g.gameTitle?.toLowerCase().trim() === gameTitleLower)) {
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

      // Small delay to ensure backend has processed the request
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Refresh user info and update store - try multiple times if needed
      let userInfo = await userServices.getUserInfo(0, true);
      if (userInfo instanceof Error || !userInfo?.user) {
        // Retry once if first attempt fails
        await new Promise((resolve) => setTimeout(resolve, 500));
        userInfo = await userServices.getUserInfo(0, true);
      }

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

  // Get user's games - memoized to prevent unnecessary re-renders
  const userGames = useMemo(() => {
    return store.user?.profile?.games || [];
  }, [store.user?.profile?.games]);

  // Local validation based on formState and games - updates in real-time
  const localValidation = useMemo(() => {
    const localMissingFields: string[] = [];

    // Validate name from formState
    if (!formState.name || formState.name.trim().length < 2) {
      localMissingFields.push("name");
    }

    // Validate nick_name from formState
    if (!formState.nick_name || formState.nick_name.trim().length < 2) {
      localMissingFields.push("nick_name");
    }

    // Validate age from formState
    if (!formState.age || formState.age < 18) {
      localMissingFields.push("age");
    }

    // Validate gender from formState
    if (
      !formState.gender ||
      formState.gender.trim().length < 2 ||
      formState.gender === DEFAULT_VALUES.GENDER_UNDEFINED
    ) {
      localMissingFields.push("gender");
    }

    // Validate location from formState
    if (!formState.location || formState.location.trim().length < 2) {
      localMissingFields.push("location");
    }

    // Validate games from store
    if (!userGames || userGames.length === 0) {
      localMissingFields.push("games");
    }

    const localCompletedFields = 6 - localMissingFields.length;
    const localCompletionPercentage = Math.round((localCompletedFields / 6) * 100);

    return {
      isComplete: localMissingFields.length === 0,
      missingFields: localMissingFields,
      completionPercentage: localCompletionPercentage,
    };
  }, [formState, userGames]);

  // Use local validation for UI, but keep store validation as fallback
  const displayValidation = localValidation;
  const displayIsComplete = displayValidation.isComplete;
  const displayMissingFields = displayValidation.missingFields;
  const displayCompletionPercentage = displayValidation.completionPercentage;

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="onboarding-header">
          <h1 className="onboarding-title">
            <i className={displayIsComplete ? "fa-solid fa-check-circle" : "fa-solid fa-rocket"} />{" "}
            {displayIsComplete ? "Profile Completed" : "Complete Your Profile"}
          </h1>
          <p className="onboarding-subtitle">
            {displayIsComplete
              ? "Your profile is complete! Click Next to go to your profile."
              : "Complete these fields to unlock all PlayerLink features"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="onboarding-progress">
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${displayCompletionPercentage}%` }}
            />
          </div>
          <p className="progress-text">
            {displayCompletionPercentage}% complete ({6 - displayMissingFields.length}/6 fields)
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
        {displayMissingFields.length > 0 && !displayIsComplete && (
          <div className="onboarding-missing">
            <p className="missing-title">Pending fields:</p>
            <ul className="missing-list">
              {displayMissingFields.map((field) => (
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
              <label className={displayMissingFields.includes("name") ? "required" : ""}>
                Name
              </label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Your name"
                maxLength={40}
                className={displayMissingFields.includes("name") ? "error" : ""}
              />
              {displayMissingFields.includes("name") && (
                <span className="field-error">Minimum 2 characters</span>
              )}
            </div>

            {/* Nickname */}
            <div className="form-group">
              <label className={displayMissingFields.includes("nick_name") ? "required" : ""}>
                Nickname
              </label>
              <input
                type="text"
                value={formState.nick_name}
                onChange={(e) => handleInputChange("nick_name", e.target.value)}
                placeholder="Your nickname"
                maxLength={21}
                className={displayMissingFields.includes("nick_name") ? "error" : ""}
              />
              {displayMissingFields.includes("nick_name") && (
                <span className="field-error">Minimum 2 characters</span>
              )}
            </div>

            {/* Age and Gender */}
            <div className="form-row">
              <div className="form-group">
                <label className={displayMissingFields.includes("age") ? "required" : ""}>
                  Age
                </label>
                <div className="onboarding-game-input-container onboarding-age-with-spinner">
                  <input
                    type="number"
                    className={`onboarding-game-input hours-input${displayMissingFields.includes("age") ? " error" : ""}`}
                    value={formState.age || ""}
                    onChange={(e) => handleInputChange("age", Number(e.target.value))}
                    placeholder="18+"
                    min={18}
                    max={120}
                  />
                  <div className="hours-spinner-buttons">
                    <button
                      type="button"
                      className="hours-spinner-btn hours-spinner-up"
                      disabled={(formState.age || 0) >= 120}
                      onClick={() => {
                        const v = Number(formState.age) || 0;
                        const next = v < 18 ? 18 : Math.min(120, v + 1);
                        handleInputChange("age", next);
                      }}
                      aria-label="Increase age"
                    >
                      <i className="fa-solid fa-chevron-up" />
                    </button>
                    <button
                      type="button"
                      className="hours-spinner-btn hours-spinner-down"
                      disabled={!formState.age || formState.age <= 18}
                      onClick={() => {
                        const v = Number(formState.age) || 0;
                        if (v > 18) handleInputChange("age", v - 1);
                      }}
                      aria-label="Decrease age"
                    >
                      <i className="fa-solid fa-chevron-down" />
                    </button>
                  </div>
                </div>
                {displayMissingFields.includes("age") && (
                  <span className="field-error">You must be 18 or older</span>
                )}
              </div>

              <div className="form-group">
                <label className={displayMissingFields.includes("gender") ? "required" : ""}>
                  Gender
                </label>
                <select
                  value={formState.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className={displayMissingFields.includes("gender") ? "error" : ""}
                >
                  {GENDER_OPTIONS.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
                {displayMissingFields.includes("gender") && (
                  <span className="field-error">Please select a gender</span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label className={displayMissingFields.includes("location") ? "required" : ""}>
                Location
              </label>
              <input
                type="text"
                value={formState.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Your city or country"
                maxLength={PROFILE_FIELD_LIMITS.LOCATION_MAX}
                className={displayMissingFields.includes("location") ? "error" : ""}
              />
              {displayMissingFields.includes("location") && (
                <span className="field-error">Minimum 2 characters</span>
              )}
            </div>
          </div>

          {/* Games Section */}
          <div className="form-section">
            <h3 className="section-title">Games</h3>

            {/* Games List */}
            {userGames.length > 0 && (
              <div className="games-list">
                {userGames.map((game) => (
                  <div key={`game-${game.id}`} className="game-item">
                    <span className="game-name">{game.gameTitle}</span>
                    <span className="game-hours">{game.gameHoursPlayed}h</span>
                    <button
                      type="button"
                      className="game-delete-btn"
                      onClick={() => handleDeleteGame(game.id)}
                      title="Delete game"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Game Button */}
            <button type="button" className="btn-add-game" onClick={() => setShowGameForm(true)}>
              <i className="fa-solid fa-plus" /> Add Game
            </button>

            {displayMissingFields.includes("games") && (
              <span className="field-error">Add at least one game</span>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="onboarding-actions">
          {displayIsComplete ? (
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
                disabled={!displayIsComplete || isSaving}
                onClick={() => navigate("/private/profile")}
              >
                {isSaving ? "Saving..." : "Next"}
              </button>
              <p className="help-text">
                Fields are saved automatically. Complete all fields to continue.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Game Form Modal */}
      <AddGameModal
        isOpen={showGameForm}
        game={{
          title: gameFormData.title,
          hours_played: gameFormData.hours_played,
          image: gameFormData.image,
        }}
        gameOptions={gameOptions}
        errorRepeatedGame={gameFormErrors.repeatedGame}
        errorHoursPlayed={gameFormErrors.hoursPlayed}
        isLoading={loadingGames}
        onGameChange={(field, value) => {
          setGameFormData((prev) => ({
            ...prev,
            [field]: value,
          }));
        }}
        onHoursChange={(hours) => {
          setGameFormData((prev) => ({
            ...prev,
            hours_played: hours,
          }));
        }}
        onAdd={handleAddGame}
        onCancel={() => {
          setShowGameForm(false);
          setGameFormErrors({});
        }}
      />
    </div>
  );
};
