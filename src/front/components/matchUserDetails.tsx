import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userServices from "../services/userServices";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "./matchUserDetails.css";
import "../pages/Privateviews/Profile.css";
import reviewServices from "../services/reviewServices";
import { selectMedal, selectPhoto } from "../utils/profileHelpers";
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

const renderStars = (stars: number) => {
  return [...Array(5)].map((_, i) => (
    <i
      key={i}
      className={`fa-star ${i < stars ? "fa-solid" : "fa-regular"}`}
      style={{
        color: "#ffc107",
        opacity: i >= stars ? 0.4 : 1,
        textShadow: i < stars ? "0 0 8px rgba(255, 193, 7, 0.5)" : "none",
      }}
    />
  ));
};

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

  const allGames = (store.itsMatchInfo?.profile?.games ?? []) as Game[];
  const topThreeGames = allGames
    .slice()
    .sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0))
    .slice(0, 3);

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

      Promise.all([
        userServices.getUserInfoById(userId),
        reviewServices.getAllReviewsReceived(userId),
      ])
        .then(([userData, reviewsData]) => {
          dispatch({ type: "getItsMatchInfo", payload: userData });
          dispatch({ type: "matchReviewsReceived", payload: reviewsData });
        })
        .catch((err) => console.error("Failed to load user info:", err))
        .finally(() => setIsLoading(false));
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
      name: p.name ?? "No data",
      nickname: p.nick_name ?? "No data",
      age: p.age ?? "No data",
      gender: p.gender ?? "No data",
      location: p.location ?? "No data",
      zodiac: p.zodiac ?? "No data",
      discord: p.discord ?? "No data",
      steam: p.steam ?? "No data",
      languages: p.language ?? "No data",
      gamingPrefs: p.preferences ?? "No data",
      bio: p.bio ?? "No bio available",
      photo: p.photo ?? "",
    };
  }, [store.itsMatchInfo]);

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
          .then((data) => dispatch({ type: "matchReviewsReceived", payload: data }));
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

        <h2 className="match-nickname">{profile.nickname}</h2>
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
                  <img src={game.gameImage} alt={game.gameTitle} className="match-game-img" />
                  <div className="match-game-info">
                    <span className="match-game-title">{game.gameTitle}</span>
                    <span className="match-game-hours">{game.gameHoursPlayed}h</span>
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
          <div className="match-info-section">
            <div className="match-info-grid">
              <div className="match-info-item">
                <label>Name</label>
                <p>{profile.name}</p>
              </div>
              <div className="match-info-item">
                <label>Nickname</label>
                <p>{profile.nickname}</p>
              </div>
              <div className="match-info-item">
                <label>Age</label>
                <p>{profile.age}</p>
              </div>
              <div className="match-info-item">
                <label>Gender</label>
                <p>{profile.gender}</p>
              </div>
              <div className="match-info-item">
                <label>Zodiac</label>
                <p>{profile.zodiac}</p>
              </div>
              <div className="match-info-item">
                <label>Location</label>
                <p>{profile.location}</p>
              </div>
              <div className="match-info-item full-width">
                <label>
                  <i className="fa-brands fa-discord" /> Discord
                </label>
                <p className="match-contact">{profile.discord}</p>
              </div>
              <div className="match-info-item full-width">
                <label>
                  <i className="fa-brands fa-steam" /> Steam ID
                </label>
                <p className="match-contact">{profile.steam}</p>
              </div>
              <div className="match-info-item full-width">
                <label>
                  <i className="fa-solid fa-gamepad" /> Gaming Preferences
                </label>
                <p>{profile.gamingPrefs}</p>
              </div>
              <div className="match-info-item full-width">
                <label>
                  <i className="fa-solid fa-language" /> Languages
                </label>
                <p>{profile.languages}</p>
              </div>
            </div>
          </div>
        )}

        {/* Games Tab */}
        {activeTab === "Games" && (
          <div className="container match-info-section">
            <div className="row justify-content-start">
              <div className="col-lg-6 col-md-12 col-sm-12 d-flex align-items-center">
                <h2 className="mb-0">Games</h2>
                <span className="tooltip-wrapper ms-2">
                  <i className="fa-solid fa-circle-info fa-xl medals-info-icon"></i>
                  <span className="tooltip-text medal-info-tooltip-text">
                    <strong>Medal Info:</strong>
                    <div>
                      <i className="fa-solid fa-medal mt-1 medal-info-gold"></i> +2500 hours
                    </div>
                    <div>
                      <i className="fa-solid fa-medal mt-1 medal-info-silver"></i> +500 hours
                    </div>
                    <div>
                      <i className="fa-solid fa-medal mt-1 medal-info-bronze"></i> 0-500 hours
                    </div>
                  </span>
                </span>
              </div>
            </div>

            <div className="row mt-5 gap-3 justify-content-center gamesbigbox">
              {store.itsMatchInfo?.profile?.games && store.itsMatchInfo.profile.games.length > 0 ? (
                store.itsMatchInfo.profile.games.map((el, i) => (
                  <div key={i} className="col-12 gamesbox d-flex align-items-center py-3">
                    <div className="row w-100 m-0">
                      <div className="col-lg-10 col-md-12 d-flex justify-content-around align-items-center">
                        <h6 className="m-0">{el.gameTitle}</h6>
                        <h6 className="m-0">{el.gameHoursPlayed} hours</h6>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center">No games available.</p>
              )}
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === "comments" && (
          <div className="match-info-section container">
            <div className="row justify-content-around">
              <h3 className="col-1 m-2 mb-4">Comments</h3>
              <div className="col-auto m-2 mb-4">
                <button
                  type="button"
                  className="btn botonLeaveComment"
                  data-bs-toggle="modal"
                  data-bs-target="#commentModal"
                >
                  Leave a new comment
                </button>
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
                                  onClick={() =>
                                    setNewComment((prev) => ({ ...prev, stars: star }))
                                  }
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
              </div>
            </div>
            <div className="row">
              {store.matchReviewsReceived?.reviews_received &&
              store.matchReviewsReceived.reviews_received.length > 0 ? (
                store.matchReviewsReceived.reviews_received.map((el) => (
                  <div key={el.id} className="review-card">
                    <div className="review-container">
                      {el.author_nickname} — {renderStars(el.stars)}
                      <p className="m-0 border-0 review-box">
                        <span className="fa-solid fa-comment mx-2"></span>
                        {el.comment}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No comments yet.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
