import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userServices from "../services/userServices";
import useGlobalReducer from "../hooks/useGlobalReducer";
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
      className={`fa-star ${i < stars ? "fa-solid text-warning" : "fa-regular"}`}
      style={i >= stars ? { color: "#ffc107", opacity: 0.5 } : undefined}
    ></i>
  ));
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
    .slice() // 1. Copia el array para no mutar el original
    .sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0)) // 2. Orden descendente por horas
    .slice(0, 3);

  useEffect(() => {
    if (!store.user) {
      navigate("/");
      return;
    }

    if (id) {
      // Limpiar datos anteriores y mostrar loading
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
    // Limpiar popovers anteriores (evita duplicados o errores)
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      const popover = window.bootstrap?.Popover?.getInstance(el);
      if (popover) popover.dispose();
    });

    // Inicializar popovers actuales
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      if (window.bootstrap?.Popover) {
        new window.bootstrap.Popover(el);
      }
    });
  }, [topThreeGames]); // 🔥 Se reinicia solo cuando topThreeGames cambia

  // El hook useMemo de React sirve para "memorizar" (cachear) el resultado de una función de cálculo y sólo volver a
  // ejecutarla cuando cambien unas dependencias que tú le indiques. Se utiliza para optimizar el rendimiento, evitando
  // cálculos innecesarios en cada renderizado.
  const profile = useMemo(() => {
    const p: Partial<Profile> = store.itsMatchInfo?.profile ?? {};
    return {
      name: p.name ?? "no data",
      nickname: p.nick_name ?? "no data",
      age: p.age ?? "no data",
      gender: p.gender ?? "no data",
      location: p.location ?? "no data",
      zodiac: p.zodiac ?? "no data",
      discord: p.discord ?? "no data",
      steam: p.steam ?? "no data",
      languages: p.language ?? "no data",
      gamingPrefs: p.preferences ?? "no data",
      bio: p.bio ?? "no data",
      photo: p.photo ?? "no data",
    };
  }, [store.itsMatchInfo]);

  const handleSaveComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // 1. Envía la nueva review: userId, recipientId, { stars, comment }
      if (!store.user?.id || !store.itsMatchInfo?.id) return;

      await reviewServices.postNewReview(store.user.id, store.itsMatchInfo.id, newComment);

      // 2. Limpia el estado del formulario
      setNewComment({ stars: 0, comment: "" });

      // 3. Cierra el modal (Bootstrap 5 API)
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
      console.error("Error al guardar el comentario:", error);
      // aquí podrías mostrar un alert o toast de error
    }
  };

  if (isLoading || !store.itsMatchInfo) {
    return (
      <div className="profile-container d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-light">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="avatar-section">
          <img src={selectPhoto(profile.photo)} alt="Profile avatar" className="profile-avatar" />
        </div>
        <h2>{profile.nickname}</h2>
        <p className="location">{profile.location}</p>

        {/* Medals */}
        <div className="medal-list">
          {topThreeGames.map((el, index) => (
            <div key={el.id ?? index} className="medal-game-card">
              <img
                src={selectMedal(el.gameHoursPlayed)}
                alt={`${el.gameTitle} Medal`}
                className="medal-icon"
                role="button"
                data-bs-toggle="popover"
                data-bs-trigger="hover focus"
                data-bs-container="body"
                data-bs-placement="bottom"
                data-bs-content={`${el.gameTitle} — ${el.gameHoursPlayed} horas`}
              />
              <img
                className="img-fluid gameImg"
                src={el.gameImage}
                alt={`Portada de ${el.gameTitle}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="bio-box">
          <p>{profile.bio}</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {["info", "Games", "comments"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Info Tab Content */}
        {activeTab === "info" && (
          <div className="info-section container">
            <div className="row">
              <div className="col-md-6">
                <label>Name</label>
                <p>{profile.name}</p>
              </div>
              <div className="col-md-6">
                <label>Nickname</label>
                <p>{profile.nickname}</p>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <label>Age</label>
                <p>{profile.age}</p>
              </div>
              <div className="col-md-4">
                <label>Gender</label>
                <p>{profile.gender}</p>
              </div>
              <div className="col-md-4">
                <label>Zodiac</label>
                <p>{profile.zodiac}</p>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <label>Discord</label>
                  <span className="tooltip-wrapper">
                    <i className="ms-2 mt-4 fa-solid fa-circle-info fa-xl discord-info-icon"></i>
                    <span className="tooltip-text discord-info-tooltip-text">
                      <strong>Connect with your match</strong>
                      <div>
                        Want to talk to your match?
                        <br />
                        Use their Discord or Steam
                        <br />
                        info to reach out
                        <br />
                        and start chatting!
                      </div>
                    </span>
                  </span>
                </div>

                <p>{profile.discord}</p>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <label>Steam friend id</label>
                  <span className="tooltip-wrapper">
                    <i className="ms-2 mt-4 fa-solid fa-circle-info fa-xl discord-info-icon"></i>
                    <span className="tooltip-text discord-info-tooltip-text">
                      <strong>Connect with your match</strong>
                      <div>
                        Want to talk to your match?
                        <br />
                        Use their Discord or Steam
                        <br />
                        info to reach out
                        <br />
                        and start chatting!
                      </div>
                    </span>
                  </span>
                </div>
                <p>{profile.steam}</p>
              </div>
              <div className="gaming-prefs-box col-md-6">
                <label>Gaming Preferences</label>
                <p>I&apos;m looking for: {profile.gamingPrefs}</p>
              </div>
              <div className="col-md-6">
                <label>Location</label>
                <p>{profile.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === "Games" && (
          <div className="container info-section">
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
        {activeTab === "comments" && (
          <div className="info-section container">
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
                          className="btn-close "
                          data-bs-dismiss="modal"
                          aria-label="Close"
                        />
                      </div>
                      <div className="modal-body ">
                        <div className="modal-body modal-sci-fi-body">
                          {/* Rating */}
                          <div className="mb-3 text-warning">
                            <label className="form-label ">Stars</label>
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
      </div>
    </div>
  );
};
