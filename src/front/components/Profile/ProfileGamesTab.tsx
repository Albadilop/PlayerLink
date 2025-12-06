import React, { useState } from 'react';
import { selectMedal } from '../../utils/profileHelpers';
import { GameForm, GameFormData } from './GameForm';
import type { Game } from '../../types';
import type { SelectOption } from './GameForm';
import './ProfileGamesTab.css';

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
  availableGames,
  gameOptions,
  loading,
  onAddGame,
  onDeleteGame,
  onUpdateGame,
}) => {
  const [game, setGame] = useState<GameFormData>({ title: '', hours_played: '', image: '' });
  const [idOfGameBeingEdited, setIdOfGameBeingEdited] = useState<number>(0);
  const [errorRepeatedGame, setErrorRepeatedGame] = useState<string>('');
  const [errorHoursPlayed, setErrorHoursPlayed] = useState<string>('');
  const [errorCeroHours, setErrorCeroHours] = useState<string>('');

  const handleChange = (field: keyof GameFormData, value: string | number) => {
    setGame(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = async () => {
    setErrorRepeatedGame('');
    setErrorHoursPlayed('');

    if (!game.title || game.title.length <= 0 || !game.hours_played || Number(game.hours_played) <= 0) {
      setErrorHoursPlayed('Your must complete all the information');
      return;
    }

    if (games.some(g => g.gameTitle === game.title)) {
      setErrorRepeatedGame('This game is already on the list');
      return;
    }

    try {
      await onAddGame(game);
      // Cerrar modal y limpiar
      const modalEl = document.getElementById('commentModal');
      if (modalEl && window.bootstrap?.Modal) {
        const modal = window.bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
      setGame({ title: '', hours_played: '', image: '' });
      setErrorRepeatedGame('');
      setErrorHoursPlayed('');
    } catch (err) {
      console.error('Error añadiendo el juego:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, gameId: number) => {
    e.preventDefault();
    const hours = Number(game.hours_played);

    if (hours <= 0) {
      setErrorCeroHours('Hours must be more than 0');
      return;
    }

    await onUpdateGame(gameId, hours);
    setIdOfGameBeingEdited(0);
    setGame({ hours_played: 0, title: '', image: '' });
    setErrorCeroHours('');
  };

  return (
    <div className="container info-section">
      <div className="row d-flex justify-content-around align-items-center">
        <h2 className="col-lg-6 col-md-12 col-sm-12 mt-3">
          Games{' '}
          <span className="tooltip-wrapper">
            <i className="fa-solid fa-circle-info fa-2xs medals-info-icon"></i>
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
        </h2>
        <button
          type="button"
          className="btn botonLeaveComment col-lg-4 col-md-12 col-sm-12"
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
            setGame({ title: '', hours_played: '', image: '' });
            setErrorRepeatedGame('');
            setErrorHoursPlayed('');
          }}
        />
      </div>
      <div className="row mt-5 gap-3 d-flez justify-content-center gamesbigbox p-2">
        {games.length > 0 ? (
          games.map((el, i) => (
            <div key={i} className="row gamesbox d-flex align-content-center py-3">
              <div className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center">
                <h6 className="m-0">{el.gameTitle}</h6>
              </div>
              {idOfGameBeingEdited === el.id ? (
                <form
                  className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center"
                  onSubmit={(e) => handleSubmit(e, el.id)}
                >
                  <div className="row d-flex flex-row justify-content-around align-items-center">
                    {errorCeroHours && (
                      <h6 className="me-4 text-danger mt-2 error-hours-font">{errorCeroHours}</h6>
                    )}
                    <input
                      className="col-auto input-hours border-2 rounded-2 ms-2"
                      type="number"
                      name="hours_played"
                      value={game.hours_played}
                      onChange={(e) => setGame({ ...game, hours_played: e.target.value })}
                      placeholder="Hours"
                    />
                    <button
                      type="submit"
                      className="me-1 fa-solid fa-solid fa-floppy-disk btn bg-transparent botonesAccionesJuegos btn-save-game col-auto"
                    />
                    <span
                      className="ms-1 text-danger botonesAccionesJuegos btn-close-edit-game col-auto col-auto"
                      onClick={() => setIdOfGameBeingEdited(0)}
                    >
                      X
                    </span>
                  </div>
                </form>
              ) : (
                <div className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center">
                  <h6 className="m-0 col-4">{el.gameHoursPlayed} hours</h6>
                  <span
                    className="text-light botonesAccionesJuegos col-auto fa-solid fa-pencil"
                    onClick={() => setIdOfGameBeingEdited(el.id)}
                  ></span>
                  <span
                    className="text-danger botonesAccionesJuegos col-auto fa-solid fa-trash"
                    onClick={() => onDeleteGame(el.id)}
                  ></span>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No games yet</p>
        )}
        {loading && (
          <p className="text-muted mt-3">Cargando lista de juegos disponibles...</p>
        )}
      </div>
    </div>
  );
};

