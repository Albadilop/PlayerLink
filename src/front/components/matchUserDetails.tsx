import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userServices from "../services/userServices";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "./matchUserDetails.css";
import "../pages/Privateviews/Profile.css";
import "./Profile/ProfileGamesTab.css";
import reviewServices from "../services/reviewServices";
import { selectMedal, selectPhoto, formatHours } from "../utils/profileHelpers";
import { ProfileInfoTab } from "./Profile/ProfileInfoTab";
import { ProfileReviewsTab } from "./Profile/ProfileReviewsTab";
import { parsePreferences } from "../utils/formatters";
import { GameImage } from "./GameImage";
import type { Game, Profile } from "../types";

const GAMES_PER_PAGE = 5;

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

// renderStars removido - ahora se usa ProfileReviewsTab que tiene su propia función

const tabIcons: Record<string, string> = {
  info: "fa-solid fa-user",
  Games: "fa-solid fa-gamepad",
  comments: "fa-solid fa-comments",
};

export const MatchUserDetails: React.FC = () => {
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("info");
  const [newComment, setNewComment] = useState<CommentForm>({ stars: 0, comment: "" });
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMedalInfo, setShowMedalInfo] = useState<string | null>(null);

  // Obtener y ordenar juegos por horas (de mayor a menor)
  const sortedGames = useMemo(() => {
    const allGames = (store.itsMatchInfo?.profile?.games ?? []) as Game[];
    return [...allGames].sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0));
  }, [store.itsMatchInfo?.profile?.games]);

  const topThreeGames = sortedGames.slice(0, 3);

  // Calcular paginación para el tab de Games
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(sortedGames.length / GAMES_PER_PAGE);
    const startIndex = (currentPage - 1) * GAMES_PER_PAGE;
    const endIndex = startIndex + GAMES_PER_PAGE;
    const currentGames = sortedGames.slice(startIndex, endIndex);

    return {
      currentGames,
      totalPages,
      startIndex,
      endIndex,
    };
  }, [sortedGames, currentPage]);

  // Resetear a página 1 cuando cambian los juegos
  useEffect(() => {
    setCurrentPage(1);
  }, [sortedGames.length]);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < paginationData.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Generar números de página a mostrar
  const getPageNumbers = () => {
    const totalPages = paginationData.totalPages;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Si hay 7 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Si hay más de 7 páginas, mostrar con elipsis
      if (currentPage <= 3) {
        // Al inicio
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Al final
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En el medio
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

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
      location: p.location?.trim() || " ",
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
        <p className="match-location">
          <i className="fa-solid fa-location-dot" />
          {profile.location}
        </p>

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
                    data-bs-content={`${game.gameTitle} — ${formatHours(game.gameHoursPlayed)}`}
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

        {/* Games Tab */}
        {activeTab === "Games" && (
          <div className="container info-section">
            <div className="row justify-content-between align-items-center mb-3">
              <div className="col-auto">
                <h3 className="m-0 d-flex align-items-center gap-2 flex-wrap">
                  <span className="d-flex align-items-center gap-2">
                    <i className="fa-solid fa-gamepad section-title-icon"></i>
                    Games
                  </span>
                  <span className="medal-badges-container">
                    <span
                      className="medal-badge medal-badge-gold"
                      onClick={() => setShowMedalInfo(showMedalInfo === "gold" ? null : "gold")}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="fa-solid fa-medal"></i>
                      <span className="medal-badge-text">Gold</span>
                    </span>
                    <span
                      className="medal-badge medal-badge-silver"
                      onClick={() => setShowMedalInfo(showMedalInfo === "silver" ? null : "silver")}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="fa-solid fa-medal"></i>
                      <span className="medal-badge-text">Silver</span>
                    </span>
                    <span
                      className="medal-badge medal-badge-bronze"
                      onClick={() => setShowMedalInfo(showMedalInfo === "bronze" ? null : "bronze")}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="fa-solid fa-medal"></i>
                      <span className="medal-badge-text">Bronze</span>
                    </span>
                  </span>
                </h3>
              </div>
            </div>

            {/* Medal Info Modal */}
            {showMedalInfo && (
              <div className="modal-overlay" onClick={() => setShowMedalInfo(null)}>
                <div
                  className="modal-content medal-info-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-header medal-info-header">
                    <div className="medal-info-title-wrapper">
                      <i
                        className={`fa-solid fa-medal medal-info-icon ${
                          showMedalInfo === "gold"
                            ? "medal-info-gold"
                            : showMedalInfo === "silver"
                              ? "medal-info-silver"
                              : "medal-info-bronze"
                        }`}
                      ></i>
                      <h3 className="medal-info-title">
                        {showMedalInfo === "gold"
                          ? "Gold Medal"
                          : showMedalInfo === "silver"
                            ? "Silver Medal"
                            : "Bronze Medal"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="modal-close medal-info-close"
                      onClick={() => setShowMedalInfo(null)}
                    >
                      <i className="fa-solid fa-times" />
                    </button>
                  </div>
                  <div className="modal-body medal-info-body">
                    <div className="medal-info-content">
                      <p className="medal-info-description">
                        {showMedalInfo === "gold" ? (
                          <>
                            <strong>Gold Medal</strong> is awarded to players who have played{" "}
                            <strong className="medal-info-hours">2500 hours or more</strong> in a
                            single game.
                          </>
                        ) : showMedalInfo === "silver" ? (
                          <>
                            <strong>Silver Medal</strong> is awarded to players who have played
                            between <strong className="medal-info-hours">500 and 2499 hours</strong>{" "}
                            in a single game.
                          </>
                        ) : (
                          <>
                            <strong>Bronze Medal</strong> is awarded to players who have played
                            between <strong className="medal-info-hours">0 and 499 hours</strong> in
                            a single game.
                          </>
                        )}
                      </p>
                      <div className="medal-info-range">
                        <span className="medal-info-label">Hours Range:</span>
                        <span className="medal-info-value">
                          {showMedalInfo === "gold"
                            ? "2500+ hours"
                            : showMedalInfo === "silver"
                              ? "500 - 2499 hours"
                              : "0 - 499 hours"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="games-content-area">
              <div className="row mt-3 gap-2 d-flez justify-content-center gamesbigbox p-2">
                {sortedGames.length > 0 ? (
                  <>
                    {paginationData.currentGames.map((el, i) => (
                      <div key={i} className="game-card">
                        <div className="game-card-content">
                          <div className="game-info">
                            <div className="game-title-section">
                              <GameImage
                                gameTitle={el.gameTitle}
                                gameImage={el.gameImage}
                                className="game-image"
                                alt={el.gameTitle}
                                rawgApiKey={import.meta.env.VITE_RAWG_KEY || null}
                              />
                              <h5 className="game-title">{el.gameTitle}</h5>
                            </div>
                          </div>

                          <div className="game-stats">
                            <div className="hours-display">
                              <img
                                src={selectMedal(el.gameHoursPlayed)}
                                alt="Medal"
                                className="game-medal"
                              />
                              <span className="hours-text">{formatHours(el.gameHoursPlayed)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <i className="fa-solid fa-gamepad"></i>
                    </div>
                    <p className="empty-state-text">No games available yet</p>
                  </div>
                )}
              </div>
            </div>
            {/* Controles de paginación - al final de la tarjeta */}
            {sortedGames.length > 0 && paginationData.totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <i className="fa-solid fa-chevron-left"></i> Previous
                </button>

                <div className="pagination-numbers">
                  {getPageNumbers().map((page, index) => {
                    if (page === "...") {
                      return (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        className={`pagination-number ${currentPage === page ? "active" : ""}`}
                        onClick={() => handlePageClick(page as number)}
                        aria-label={`Go to page ${page}`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="pagination-btn"
                  onClick={handleNext}
                  disabled={currentPage === paginationData.totalPages}
                  aria-label="Next page"
                >
                  Next <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
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
                        value={newComment.comment}
                        onChange={(e) =>
                          setNewComment((prev) => ({ ...prev, comment: e.target.value }))
                        }
                        placeholder="Write your comment here..."
                      />
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
