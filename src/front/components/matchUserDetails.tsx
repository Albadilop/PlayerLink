import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userServices from "../services/userServices";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "./matchUserDetails.css";
import "../pages/Privateviews/Profile.css";
import "./Profile/ProfileGamesTab.css";
import reviewServices from "../services/reviewServices";
import { selectMedal, selectPhoto, formatHours } from "../utils/profileHelpers";
import { ProfileInfoTab } from "./Profile/ProfileInfoTab";
import { ProfileGamesTab } from "./Profile/ProfileGamesTab";
import { ProfileReviewsTab } from "./Profile/ProfileReviewsTab";
import { parsePreferences } from "../utils/formatters";
import { clampProfileLocation } from "../utils/profileValidation";
import { REVIEW_FIELD_LIMITS } from "../constants";
import { GameImage } from "./GameImage";
import type { Game, Profile } from "../types";

interface CommentForm {
  stars: number;
  comment: string;
}

declare global {
  interface Window {
    bootstrap: {
      Modal: {
        getInstance: (el: Element) => { hide: () => void } | null;
      };
      Popover: {
        getInstance: (el: Element) => { dispose: () => void } | null;
        new (el: Element): void;
      };
    };
  }
}

const tabIcons: Record<string, string> = {
  info: "fa-solid fa-user",
  Games: "fa-solid fa-gamepad",
  comments: "fa-solid fa-comments",
};

function renderMatchAverageStars(avg: number): React.ReactNode {
  const rowClass = "match-header-stars-row";
  if (!Number.isFinite(avg) || avg <= 0) {
    return (
      <div className={rowClass} aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className="fa-regular fa-star match-header-star match-header-star--empty" />
        ))}
      </div>
    );
  }
  const clamped = Math.min(5, Math.max(0, avg));
  return (
    <div className={rowClass} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        if (clamped >= i + 1) {
          return <i key={i} className="fa-solid fa-star match-header-star" />;
        }
        if (clamped >= i + 0.5) {
          return <i key={i} className="fa-solid fa-star-half-stroke match-header-star" />;
        }
        return (
          <i key={i} className="fa-regular fa-star match-header-star match-header-star--empty" />
        );
      })}
    </div>
  );
}

export const MatchUserDetails: React.FC = () => {
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("info");
  const [newComment, setNewComment] = useState<CommentForm>({ stars: 0, comment: "" });
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const matchProfileGames = useMemo(
    () => (store.itsMatchInfo?.profile?.games ?? []) as Game[],
    [store.itsMatchInfo?.profile?.games]
  );

  const topThreeGames = useMemo(() => {
    return [...matchProfileGames]
      .sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0))
      .slice(0, 3);
  }, [matchProfileGames]);

  const noopAddGame = useCallback(async () => {}, []);
  const noopDeleteGame = useCallback(async () => {}, []);
  const noopUpdateGame = useCallback(async () => {}, []);

  useEffect(() => {
    if (!store.user) {
      navigate("/");
      return;
    }

    if (id) {
      setIsLoading(true);
      dispatch({ type: "getItsMatchInfo", payload: null });
      dispatch({ type: "matchReviewsReceived", payload: null });

      const userId = parseInt(id, 10);

      // Cargar datos del usuario y reviews por separado para mejor manejo de errores
      userServices
        .getUserInfoById(userId)
        .then((userData) => {
          if (!(userData instanceof Error)) {
            dispatch({ type: "getItsMatchInfo", payload: userData });
          } else {
            console.error("Error loading user info:", userData);
          }
        })
        .catch((err) => {
          console.error("Failed to load user info:", err);
        });

      // Cargar reviews por separado con un pequeño delay para evitar problemas de timing
      setTimeout(() => {
        reviewServices
          .getAllReviewsReceived(userId)
          .then((reviewsData) => {
            // Verificar que reviewsData no sea un Error
            if (reviewsData instanceof Error) {
              console.error("Error loading reviews:", reviewsData);
              dispatch({ type: "matchReviewsReceived", payload: { reviews_received: [] } });
            } else {
              dispatch({ type: "matchReviewsReceived", payload: reviewsData });
            }
          })
          .catch((err) => {
            console.error("Failed to load reviews:", err);
            dispatch({ type: "matchReviewsReceived", payload: { reviews_received: [] } });
          })
          .finally(() => setIsLoading(false));
      }, 100); // Pequeño delay para asegurar que el backend esté listo
    }
  }, [navigate, store.user, id, dispatch]);

  useEffect(() => {
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      const popover = window.bootstrap?.Popover?.getInstance(el);
      if (popover) popover.dispose();
    });

    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      if (window.bootstrap?.Popover) {
        new window.bootstrap.Popover(el);
      }
    });
  }, [topThreeGames]);

  const profile = useMemo(() => {
    const p: Partial<Profile> = store.itsMatchInfo?.profile ?? {};
    return {
      name: p.name?.trim() || " ",
      nick_name: p.nick_name?.trim() || "",
      age: p.age || 0,
      gender: p.gender?.trim() || " ",
      location: clampProfileLocation(p.location?.trim() || " "),
      zodiac: p.zodiac?.trim() || " ",
      discord: p.discord?.trim() || " ",
      steam_id: p.steam?.trim() || " ",
      languages: p.language?.trim() || " ",
      preferences: p.preferences?.trim() || " ",
      bio: p.bio?.trim() || " ",
      photo: p.photo || "",
    };
  }, [store.itsMatchInfo]);

  // Preparar datos para ProfileInfoTab (solo lectura)
  const profileForInfoTab = useMemo(() => profile, [profile]);
  const selectedGamingPreferences = useMemo(
    () => parsePreferences(profile.preferences),
    [profile.preferences]
  );
  const selectedLanguages = useMemo(() => parsePreferences(profile.languages), [profile.languages]);

  const matchReceivedReviews = useMemo(() => {
    const raw = store.matchReviewsReceived?.reviews_received;
    return Array.isArray(raw) ? raw : [];
  }, [store.matchReviewsReceived]);

  const { averageRating, reviewCount } = useMemo(() => {
    const list = matchReceivedReviews;
    if (list.length === 0) return { averageRating: 0, reviewCount: 0 };
    const sum = list.reduce((acc, r) => acc + (r.stars || 0), 0);
    return { averageRating: sum / list.length, reviewCount: list.length };
  }, [matchReceivedReviews]);

  const handleSaveComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!store.user?.id || !store.itsMatchInfo?.id) return;

      await reviewServices.postNewReview(store.user.id, store.itsMatchInfo.id, newComment);
      setNewComment({ stars: 0, comment: "" });

      const modalEl = document.getElementById("commentModal");
      if (modalEl && window.bootstrap?.Modal) {
        const modalInstance = window.bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      }

      if (id) {
        const userId = parseInt(id, 10);
        reviewServices
          .getAllReviewsReceived(userId)
          .then((data) => {
            if (data instanceof Error) {
              console.error("Error loading reviews after comment:", data);
              dispatch({ type: "matchReviewsReceived", payload: { reviews_received: [] } });
            } else {
              dispatch({ type: "matchReviewsReceived", payload: data });
            }
          })
          .catch((err) => {
            console.error("Error loading reviews after comment:", err);
            dispatch({ type: "matchReviewsReceived", payload: { reviews_received: [] } });
          });
      }
    } catch (error) {
      console.error("Error saving comment:", error);
    }
  };

  if (isLoading || !store.itsMatchInfo) {
    return (
      <div className="match-profile-loading">
        <div className="loading-matches-spinner"></div>
        <h4 className="loading-matches-text">Loading profile...</h4>
      </div>
    );
  }

  return (
    <div className="match-profile-container">
      {/* Left Panel - Profile Header */}
      <aside className="match-profile-header">
        <div className="match-avatar-wrapper">
          <div className="match-avatar-ring" />
          <img src={selectPhoto(profile.photo)} alt="Avatar" className="match-avatar-img" />
        </div>

        <h2 className="match-nickname">{profile.nick_name || "Player"}</h2>
        <p className="match-location mb-2">
          <i className="fa-solid fa-location-dot" />
          {profile.location}
        </p>

        <div
          className="match-header-rating"
          aria-label={
            reviewCount === 0
              ? "No reviews yet"
              : `Average rating ${averageRating.toFixed(1)} of 5, ${reviewCount} reviews`
          }
        >
          {renderMatchAverageStars(averageRating)}
          {reviewCount > 0 ? (
            <span className="match-header-rating-meta">
              <span className="match-header-rating-count"></span>
            </span>
          ) : (
            <span className="match-header-rating-empty">No reviews yet</span>
          )}
        </div>

        {/* Bio */}
        <div className="match-bio">
          <p>{profile.bio}</p>
        </div>

        {/* Top Games */}
        {topThreeGames.length > 0 && (
          <div className="match-top-games">
            <span className="match-top-games-label">
              <i className="fa-solid fa-trophy" /> Top Games
            </span>
            <div className="match-games-list">
              {topThreeGames.map((game, i) => (
                <div key={game.id || i} className="match-game-card">
                  <GameImage
                    gameTitle={game.gameTitle}
                    gameImage={game.gameImage}
                    className="match-game-img"
                    alt={game.gameTitle}
                    rawgApiKey={import.meta.env.VITE_RAWG_KEY || null}
                  />
                  <div className="match-game-info">
                    <span className="match-game-title">{game.gameTitle}</span>
                  </div>
                  <img
                    src={selectMedal(game.gameHoursPlayed)}
                    alt="Medal"
                    className="match-medal"
                    data-bs-toggle="popover"
                    data-bs-trigger="hover focus"
                    data-bs-container="body"
                    data-bs-placement="right"
                    data-bs-html="true"
                    data-bs-content={`${game.gameTitle} — <span class="popover-hours">${formatHours(game.gameHoursPlayed)}</span>`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Right Panel - Content */}
      <main className="match-profile-content">
        {/* Tabs */}
        <div className="match-tabs">
          {["info", "Games", "comments"].map((tab) => (
            <button
              key={tab}
              className={`match-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              <i className={tabIcons[tab]} />
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              {activeTab === tab && <span className="match-tab-indicator" />}
            </button>
          ))}
        </div>

        {/* Info Tab */}
        {activeTab === "info" && (
          <ProfileInfoTab
            profile={profileForInfoTab}
            isEditing={false}
            selectedGamingPreferences={selectedGamingPreferences}
            selectedLanguages={selectedLanguages}
            showGamingPreferencesModal={false}
            showLanguageModal={false}
            onInputChange={() => {}}
            onGamingPreferencesChange={() => {}}
            onLanguagesChange={() => {}}
            onShowGamingPreferencesModal={() => {}}
            onShowLanguageModal={() => {}}
            onSave={undefined}
          />
        )}

        {/* Games Tab — misma UI que en Profile (ProfileGamesTab en solo lectura) */}
        {activeTab === "Games" && (
          <ProfileGamesTab
            games={matchProfileGames}
            availableGames={[]}
            gameOptions={[]}
            loading={false}
            readOnly
            onAddGame={noopAddGame}
            onDeleteGame={noopDeleteGame}
            onUpdateGame={noopUpdateGame}
          />
        )}

        {/* Comments Tab */}
        {activeTab === "comments" && (
          <>
            {/* Modal de nuevo comentario */}
            <div
              className="modal fade"
              id="commentModal"
              tabIndex={-1}
              aria-labelledby="commentModalLabel"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content onboarding-game-modal">
                  <div className="modal-header onboarding-game-header">
                    <div className="onboarding-game-title-wrapper">
                      <i className="fa-solid fa-comment onboarding-game-icon"></i>
                      <h3 className="onboarding-game-title" id="commentModalLabel">
                        Leave a new comment
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="modal-close onboarding-game-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    >
                      <i className="fa-solid fa-times" />
                    </button>
                  </div>
                  <div className="modal-body onboarding-game-body">
                    {/* Rating */}
                    <div className="form-group onboarding-game-group">
                      <label className="onboarding-game-label">
                        <i className="fa-solid fa-star onboarding-game-label-icon"></i>
                        Rating
                      </label>
                      <div className="comment-rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`fa-star comment-star ${
                              (hoverRating || newComment.stars) >= star ? "fa-solid" : "fa-regular"
                            }`}
                            onClick={() => setNewComment((prev) => ({ ...prev, stars: star }))}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment textarea */}
                    <div className="form-group onboarding-game-group">
                      <label className="onboarding-game-label" htmlFor="newComment">
                        <i className="fa-solid fa-comment-dots onboarding-game-label-icon"></i>
                        Comment
                      </label>
                      <textarea
                        id="newComment"
                        className="onboarding-game-textarea"
                        rows={4}
                        maxLength={REVIEW_FIELD_LIMITS.COMMENT_MAX}
                        value={newComment.comment}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const max = REVIEW_FIELD_LIMITS.COMMENT_MAX;
                          setNewComment((prev) => ({
                            ...prev,
                            comment: raw.length > max ? raw.slice(0, max) : raw,
                          }));
                        }}
                        placeholder="Write your comment here..."
                        aria-describedby="newComment-length-hint"
                      />
                      <div id="newComment-length-hint" className="match-comment-length-meta">
                        <span
                          className={`match-comment-length-count${
                            newComment.comment.length >= REVIEW_FIELD_LIMITS.COMMENT_MAX
                              ? " match-comment-length-count--limit"
                              : newComment.comment.length >= REVIEW_FIELD_LIMITS.COMMENT_MAX - 10
                                ? " match-comment-length-count--near"
                                : ""
                          }`}
                        >
                          {newComment.comment.length} / {REVIEW_FIELD_LIMITS.COMMENT_MAX}
                        </span>
                        {newComment.comment.length >= REVIEW_FIELD_LIMITS.COMMENT_MAX && (
                          <p className="match-comment-length-warning" role="alert">
                            Has alcanzado el máximo de {REVIEW_FIELD_LIMITS.COMMENT_MAX} caracteres.
                            Acorta el comentario si quieres cambiar el texto.
                          </p>
                        )}
                        {newComment.comment.length >= REVIEW_FIELD_LIMITS.COMMENT_MAX - 10 &&
                          newComment.comment.length < REVIEW_FIELD_LIMITS.COMMENT_MAX && (
                            <p className="match-comment-length-notice">
                              El comentario no puede superar {REVIEW_FIELD_LIMITS.COMMENT_MAX}{" "}
                              caracteres; te quedan{" "}
                              {REVIEW_FIELD_LIMITS.COMMENT_MAX - newComment.comment.length}.
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer onboarding-game-footer">
                    <button
                      type="button"
                      className="btn onboarding-game-btn-add"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSaveComment(e as unknown as React.FormEvent<HTMLFormElement>);
                      }}
                      disabled={!newComment.comment.trim() || newComment.stars === 0}
                    >
                      <i className="fa-solid fa-check"></i>
                      Save comment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {(() => {
              // Asegurar que matchReviewsReceived no sea un Error
              const reviewsData =
                store.matchReviewsReceived instanceof Error
                  ? { reviews_received: [] }
                  : store.matchReviewsReceived;

              const reviews = reviewsData?.reviews_received || [];
              return <ProfileReviewsTab reviews={reviews} showLeaveCommentButton={true} />;
            })()}
          </>
        )}
      </main>
    </div>
  );
};
