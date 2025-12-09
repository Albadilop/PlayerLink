import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Select from "react-select";
import type { Game } from "../../types";
import { selectMedal, formatHours } from "../../utils/profileHelpers";
import { GameImage } from "../GameImage";
import "../Onboarding/Onboarding.css";
import "./ProfileGamesTab.css";

export interface GameFormData {
  title: string;
  hours_played: number | string;
  image: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

const GAMES_PER_PAGE = 5;

export interface ProfileGamesTabProps {
  games: Game[];
  availableGames: string[];
  gameOptions: SelectOption[];
  loading: boolean;
  onAddGame: (game: GameFormData) => Promise<void>;
  onDeleteGame: (gameId: number) => Promise<void>;
  onUpdateGame: (gameId: number, hours: number) => Promise<void>;
}

export const ProfileGamesTab: React.FC<ProfileGamesTabProps> = ({
  games,
  availableGames: _availableGames,
  gameOptions,
  loading: _loading,
  onAddGame,
  onDeleteGame,
  onUpdateGame,
}) => {
  const [game, setGame] = useState<GameFormData>({ title: "", hours_played: "", image: "" });
  const [idOfGameBeingEdited, setIdOfGameBeingEdited] = useState<number>(0);
  const [errorRepeatedGame, setErrorRepeatedGame] = useState<string>("");
  const [errorHoursPlayed, setErrorHoursPlayed] = useState<string>("");
  const [errorCeroHours, setErrorCeroHours] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showGameForm, setShowGameForm] = useState(false);
  const [showMedalInfo, setShowMedalInfo] = useState<string | null>(null);

  const handleChange = React.useCallback((field: keyof GameFormData, value: string | number) => {
    setGame((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAdd = React.useCallback(async () => {
    console.log("[ProfileGamesTab] handleAdd llamado", {
      game: game,
      gamesCount: games.length,
    });

    setErrorRepeatedGame("");
    setErrorHoursPlayed("");

    if (
      !game.title ||
      game.title.length <= 0 ||
      !game.hours_played ||
      Number(game.hours_played) <= 0
    ) {
      console.log("[ProfileGamesTab] Validación fallida: campos incompletos");
      setErrorHoursPlayed("You must complete all the information");
      return;
    }

    if (games.some((g) => g.gameTitle === game.title)) {
      console.log("[ProfileGamesTab] Validación fallida: juego duplicado");
      setErrorRepeatedGame("This game is already on the list");
      return;
    }

    try {
      console.log("[ProfileGamesTab] Llamando onAddGame");
      await onAddGame(game);

      console.log("[ProfileGamesTab] onAddGame completado, cerrando modal");
      // Cerrar modal y limpiar
      setShowGameForm(false);
      setGame({ title: "", hours_played: "", image: "" });
      setErrorRepeatedGame("");
      setErrorHoursPlayed("");
    } catch (err) {
      console.error("[ProfileGamesTab] Error adding game:", err);
    }
  }, [game, games, onAddGame]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, gameId: number) => {
    e.preventDefault();
    const hours = Math.floor(Number(game.hours_played));

    if (hours <= 0) {
      setErrorCeroHours("Hours must be more than 0");
      return;
    }

    // Validar rango máximo (PostgreSQL INTEGER max)
    if (hours > 2147483647) {
      setErrorCeroHours("Hours value is too large");
      return;
    }

    await onUpdateGame(gameId, hours);
    setIdOfGameBeingEdited(0);
    setGame({ hours_played: 0, title: "", image: "" });
    setErrorCeroHours("");
  };

  const handleStartEdit = (gameId: number, currentHours: number) => {
    setIdOfGameBeingEdited(gameId);
    setGame({ ...game, hours_played: currentHours });
    setErrorCeroHours("");
  };

  // Ordenar juegos por horas (de mayor a menor)
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0));
  }, [games]);

  // Calcular paginación
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
  React.useEffect(() => {
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

  return (
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
        <div className="col-auto">
          <button type="button" className="btn-add-game" onClick={() => setShowGameForm(true)}>
            Add a new game
          </button>
        </div>
      </div>

      {/* Medal Info Modal */}
      {showMedalInfo && (
        <div className="modal-overlay" onClick={() => setShowMedalInfo(null)}>
          <div className="modal-content medal-info-modal" onClick={(e) => e.stopPropagation()}>
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
                      <strong className="medal-info-hours">2500 hours or more</strong> in a single
                      game.
                    </>
                  ) : showMedalInfo === "silver" ? (
                    <>
                      <strong>Silver Medal</strong> is awarded to players who have played between{" "}
                      <strong className="medal-info-hours">500 and 2499 hours</strong> in a single
                      game.
                    </>
                  ) : (
                    <>
                      <strong>Bronze Medal</strong> is awarded to players who have played between{" "}
                      <strong className="medal-info-hours">0 and 499 hours</strong> in a single
                      game.
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

      {/* Game Form Modal */}
      {showGameForm &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowGameForm(false);
                setErrorRepeatedGame("");
                setErrorHoursPlayed("");
              }
            }}
          >
            <div
              className="modal-content onboarding-game-modal"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
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
                    setErrorRepeatedGame("");
                    setErrorHoursPlayed("");
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
                      value={gameOptions.find((opt) => opt.value === game.title) || null}
                      onChange={(selected) => handleChange("title", selected?.value || "")}
                      isSearchable
                      isClearable
                      placeholder="Search for a game..."
                      className="onboarding-game-select"
                      classNamePrefix="onboarding-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 10010 }),
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
                          borderColor: state.isFocused ? "#00f0ff" : "#7f00ff",
                          borderRadius: "10px",
                          boxShadow: state.isFocused
                            ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 240, 255, 0.4), 0 0 25px rgba(0, 240, 255, 0.2)"
                            : "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(127, 0, 255, 0.2)",
                          minHeight: "48px",
                          cursor: "pointer",
                          "&:hover": {
                            borderColor: "#8f00ff",
                            boxShadow:
                              "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(143, 0, 255, 0.3)",
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
                  {errorRepeatedGame && (
                    <div className="onboarding-game-error">
                      <i className="fa-solid fa-exclamation-circle"></i>
                      <span>{errorRepeatedGame}</span>
                    </div>
                  )}
                </div>
                <div className="form-group onboarding-game-group">
                  <label className="onboarding-game-label">
                    <i className="fa-solid fa-clock onboarding-game-label-icon"></i>
                    Hours played
                  </label>
                  <div className="onboarding-game-input-container">
                    <input
                      type="number"
                      className="onboarding-game-input hours-input"
                      value={game.hours_played || ""}
                      onChange={(e) => handleChange("hours_played", Number(e.target.value))}
                      placeholder="e.g., 42"
                      min={1}
                      max={10000}
                    />
                    <div className="hours-spinner-buttons">
                      <button
                        type="button"
                        className="hours-spinner-btn hours-spinner-up"
                        onClick={() => {
                          const currentValue = Number(game.hours_played) || 0;
                          if (currentValue < 10000) {
                            handleChange("hours_played", currentValue + 1);
                          }
                        }}
                        aria-label="Increase hours"
                      >
                        <i className="fa-solid fa-chevron-up"></i>
                      </button>
                      <button
                        type="button"
                        className="hours-spinner-btn hours-spinner-down"
                        onClick={() => {
                          const currentValue = Number(game.hours_played) || 0;
                          if (currentValue > 1) {
                            handleChange("hours_played", currentValue - 1);
                          }
                        }}
                        aria-label="Decrease hours"
                      >
                        <i className="fa-solid fa-chevron-down"></i>
                      </button>
                    </div>
                  </div>
                  {errorHoursPlayed && (
                    <div className="onboarding-game-error">
                      <i className="fa-solid fa-exclamation-circle"></i>
                      <span>{errorHoursPlayed}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer onboarding-game-footer">
                <button type="button" className="btn onboarding-game-btn-add" onClick={handleAdd}>
                  <i className="fa-solid fa-plus"></i>
                  Add Game
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="games-content-area">
        <div className="row mt-3 gap-2 d-flez justify-content-center gamesbigbox p-2">
          {games.length > 0 ? (
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

                    {idOfGameBeingEdited === el.id ? (
                      <form className="game-edit-form" onSubmit={(e) => handleSubmit(e, el.id)}>
                        <div className="edit-form-content">
                          {errorCeroHours && <div className="error-message">{errorCeroHours}</div>}
                          <div className="edit-input-group">
                            <input
                              className="input-hours"
                              type="number"
                              name="hours_played"
                              min="1"
                              max="999999"
                              value={game.hours_played}
                              onChange={(e) => setGame({ ...game, hours_played: e.target.value })}
                              placeholder="Hours"
                              autoFocus
                            />
                            <div className="edit-actions">
                              <button
                                type="submit"
                                className="btn-action btn-save"
                                title="Save changes"
                              >
                                <i className="fa-solid fa-floppy-disk"></i>
                              </button>
                              <button
                                type="button"
                                className="btn-action btn-cancel"
                                onClick={() => setIdOfGameBeingEdited(0)}
                                title="Cancel"
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="game-stats">
                        <div className="hours-display">
                          <img
                            src={selectMedal(el.gameHoursPlayed)}
                            alt="Medal"
                            className="game-medal"
                          />
                          <span className="hours-text">{formatHours(el.gameHoursPlayed)}</span>
                        </div>
                        <div className="game-actions">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleStartEdit(el.id, el.gameHoursPlayed)}
                            title="Edit hours"
                          >
                            <i className="fa-solid fa-pencil"></i>
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => onDeleteGame(el.id)}
                            title="Delete game"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fa-solid fa-gamepad"></i>
              </div>
              <h3 className="empty-state-title">No games yet</h3>
              <p className="empty-state-message">
                Start building your gaming profile by adding your favorite games!
              </p>
              <button
                type="button"
                className="btn-add-first-game"
                onClick={() => setShowGameForm(true)}
              >
                <i className="fa-solid fa-plus"></i> Add Your First Game
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Controles de paginación - al final de la tarjeta */}
      {games.length > 0 && paginationData.totalPages > 1 && (
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
  );
};
