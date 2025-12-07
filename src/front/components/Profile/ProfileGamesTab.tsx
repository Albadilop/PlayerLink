import React, { useState, useMemo, useRef, useEffect } from "react";
import { GameForm, GameFormData } from "./GameForm";
import type { Game } from "../../types";
import type { SelectOption } from "./GameForm";
import { selectMedal } from "../../utils/profileHelpers";
import { GameImage } from "../GameImage";
import "./ProfileGamesTab.css";

const GAMES_PER_PAGE = 4;

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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipIconRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const handleChange = (field: keyof GameFormData, value: string | number) => {
    setGame((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = async () => {
    setErrorRepeatedGame("");
    setErrorHoursPlayed("");

    if (
      !game.title ||
      game.title.length <= 0 ||
      !game.hours_played ||
      Number(game.hours_played) <= 0
    ) {
      setErrorHoursPlayed("You must complete all the information");
      return;
    }

    if (games.some((g) => g.gameTitle === game.title)) {
      setErrorRepeatedGame("This game is already on the list");
      return;
    }

    try {
      await onAddGame(game);
      // Cerrar modal y limpiar
      const modalEl = document.getElementById("commentModal");
      if (modalEl && window.bootstrap?.Modal) {
        const modal = window.bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
      setGame({ title: "", hours_played: "", image: "" });
      setErrorRepeatedGame("");
      setErrorHoursPlayed("");
    } catch (err) {
      console.error("Error adding game:", err);
    }
  };

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

  // Calcular posición del tooltip cuando se muestra
  useEffect(() => {
    const updateTooltipPosition = () => {
      if (tooltipIconRef.current && showTooltip) {
        const rect = tooltipIconRef.current.getBoundingClientRect();
        const tooltipWidth = 260;
        const tooltipHeight = 180; // Aproximado
        const spacing = 12;

        let top = rect.top - tooltipHeight - spacing;
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;

        // Asegurar que no se salga de la pantalla por la izquierda
        if (left < 10) {
          left = 10;
        }

        // Asegurar que no se salga de la pantalla por la derecha
        if (left + tooltipWidth > window.innerWidth - 10) {
          left = window.innerWidth - tooltipWidth - 10;
        }

        // Si no cabe arriba, mostrarlo abajo
        if (top < 10) {
          top = rect.bottom + spacing;
        }

        setTooltipPosition({
          top: top + window.scrollY,
          left: left + window.scrollX,
        });
      }
    };

    if (showTooltip) {
      updateTooltipPosition();
      window.addEventListener("scroll", updateTooltipPosition, true);
      window.addEventListener("resize", updateTooltipPosition);
    }

    return () => {
      window.removeEventListener("scroll", updateTooltipPosition, true);
      window.removeEventListener("resize", updateTooltipPosition);
    };
  }, [showTooltip]);

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
      <div className="row d-flex justify-content-around align-items-center">
        <div className="col-lg-6 col-md-12 col-sm-12 mt-3">
          <h2 className="section-title">
            <i className="fa-solid fa-gamepad section-title-icon"></i>
            Games
            <span className="tooltip-wrapper">
              <i
                ref={tooltipIconRef}
                className="fa-solid fa-circle-info medals-info-icon"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              ></i>
              {showTooltip && (
                <span
                  ref={tooltipRef}
                  className="tooltip-text medal-info-tooltip-text"
                  style={{
                    top: `${tooltipPosition.top}px`,
                    left: `${tooltipPosition.left}px`,
                  }}
                >
                  <strong>Medal System:</strong>
                  <div>
                    <i className="fa-solid fa-medal medal-info-gold"></i> Gold: +2500 hours
                  </div>
                  <div>
                    <i className="fa-solid fa-medal medal-info-silver"></i> Silver: 500-2499 hours
                  </div>
                  <div>
                    <i className="fa-solid fa-medal medal-info-bronze"></i> Bronze: 0-499 hours
                  </div>
                  <span className="medal-info-tooltip-arrow"></span>
                </span>
              )}
            </span>
          </h2>
        </div>
        <button
          type="button"
          className="btn-add-game col-lg-4 col-md-12 col-sm-12"
          data-bs-toggle="modal"
          data-bs-target="#commentModal"
        >
          Add a new game
        </button>

        <GameForm
          game={game}
          gameOptions={gameOptions}
          errorHoursPlayed={errorHoursPlayed}
          errorRepeatedGame={errorRepeatedGame}
          onChange={handleChange}
          onSubmit={handleAdd}
          onCancel={() => {
            setGame({ title: "", hours_played: "", image: "" });
            setErrorRepeatedGame("");
            setErrorHoursPlayed("");
          }}
        />
      </div>
      <div className="row mt-5 gap-3 d-flez justify-content-center gamesbigbox p-2">
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
                        <span className="hours-text">{el.gameHoursPlayed} hours</span>
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

            {/* Información de paginación */}
            {paginationData.totalPages > 1 && (
              <div className="pagination-info">
                Showing {paginationData.startIndex + 1} -{" "}
                {Math.min(paginationData.endIndex, sortedGames.length)} of {sortedGames.length}{" "}
                games
              </div>
            )}
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
              data-bs-toggle="modal"
              data-bs-target="#commentModal"
            >
              <i className="fa-solid fa-plus"></i> Add Your First Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
