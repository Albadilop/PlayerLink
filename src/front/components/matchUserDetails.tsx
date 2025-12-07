import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userServices from "../services/userServices";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "./matchUserDetails.css";
import "../pages/Privateviews/Profile.css";
import "./Profile/ProfileGamesTab.css";
import reviewServices from "../services/reviewServices";
import { selectMedal, selectPhoto } from "../utils/profileHelpers";
import { ProfileInfoTab } from "./Profile/ProfileInfoTab";
import { ProfileReviewsTab } from "./Profile/ProfileReviewsTab";
import { parsePreferences } from "../utils/formatters";
import { GameImage } from "./GameImage";
import type { Game, Profile } from "../types";

const GAMES_PER_PAGE = 4;

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
        <div className="spinner-border text-info" role="status" />
        <p>Loading profile...</p>
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
                    data-bs-content={`${game.gameTitle} — ${game.gameHoursPlayed}h`}
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
            <div className="row d-flex justify-content-around align-items-center">
              <div className="col-lg-6 col-md-12 col-sm-12 mt-3">
                <h2 className="section-title">
                  <i className="fa-solid fa-gamepad section-title-icon"></i>
                  Games
                  <span className="tooltip-wrapper">
                    <i className="fa-solid fa-circle-info medals-info-icon"></i>
                    <span className="tooltip-text medal-info-tooltip-text">
                      <strong>Medal System:</strong>
                      <div>
                        <i className="fa-solid fa-medal medal-info-gold"></i> Gold: +2500 hours
                      </div>
                      <div>
                        <i className="fa-solid fa-medal medal-info-silver"></i> Silver: 500-2499
                        hours
                      </div>
                      <div>
                        <i className="fa-solid fa-medal medal-info-bronze"></i> Bronze: 0-499 hours
                      </div>
                      <span className="medal-info-tooltip-arrow"></span>
                    </span>
                  </span>
                </h2>
              </div>
            </div>
            <div className="row mt-5 gap-3 d-flez justify-content-center gamesbigbox p-2">
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
                            <span className="hours-text">{el.gameHoursPlayed} hours</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Controles de paginación */}
                  {paginationData.totalPages > 1 && (
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
              <div className="modal-dialog">
                <div className="modal-content modal-sci-fi">
                  <div className="modal-header modal-sci-fi-header">
                    <h5 className="modal-title modal-sci-fi-title" id="commentModalLabel">
                      Leave a new comment
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    />
                  </div>
                  <div className="modal-body">
                    <div className="modal-body modal-sci-fi-body">
                      {/* Rating */}
                      <div className="mb-3 text-warning">
                        <label className="form-label">Stars</label>
                        <div>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`fa-star fa-2x ${
                                (hoverRating || newComment.stars) >= star
                                  ? "fa-solid"
                                  : "fa-regular"
                              }`}
                              style={{ cursor: "pointer", marginRight: "0.5rem" }}
                              onClick={() => setNewComment((prev) => ({ ...prev, stars: star }))}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment textarea */}
                      <div className="mb-3">
                        <label htmlFor="newComment" className="form-label">
                          Comment
                        </label>
                        <textarea
                          id="newComment"
                          className="form-control"
                          rows={3}
                          value={newComment.comment}
                          onChange={(e) =>
                            setNewComment((prev) => ({ ...prev, comment: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer modal-sci-fi-footer">
                    <button
                      type="button"
                      className="btn btn-sci-fi-primary"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-sci-fi-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSaveComment(e as unknown as React.FormEvent<HTMLFormElement>);
                      }}
                      disabled={!newComment.comment.trim() || newComment.stars === 0}
                    >
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
