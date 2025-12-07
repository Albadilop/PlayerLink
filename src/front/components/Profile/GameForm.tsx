import React from "react";
import Select from "react-select";
import "../Onboarding/Onboarding.css";
import "./GameForm.css";

export interface GameFormData {
  title: string;
  hours_played: number | string;
  image: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface GameFormProps {
  game: GameFormData;
  gameOptions: SelectOption[];
  errorHoursPlayed?: string;
  errorRepeatedGame?: string;
  onChange: (field: keyof GameFormData, value: string | number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const GameForm: React.FC<GameFormProps> = ({
  game,
  gameOptions,
  errorHoursPlayed,
  errorRepeatedGame,
  onChange,
  onSubmit,
  onCancel,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name as keyof GameFormData, name === "hours_played" ? Number(value) : value);
  };

  const handleSelectChange = (selected: SelectOption | null) => {
    onChange("title", selected?.value || "");
  };

  return (
    <div className="modal fade" id="commentModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content onboarding-game-modal">
          <div className="modal-header onboarding-game-header">
            <div className="onboarding-game-title-wrapper">
              <i className="fa-solid fa-gamepad onboarding-game-icon"></i>
              <h5 className="modal-title onboarding-game-title" id="commentModalLabel">
                Add Game
              </h5>
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
            <div className="form-group onboarding-game-group">
              <label htmlFor="gameName" className="onboarding-game-label">
                <i className="fa-solid fa-list onboarding-game-label-icon"></i>
                Select a game
              </label>
              <div className="onboarding-game-select-wrapper">
                <Select
                  id="gameName"
                  className="onboarding-game-select"
                  classNamePrefix="onboarding-select"
                  options={gameOptions}
                  value={gameOptions.find((opt) => opt.value === game.title) || null}
                  onChange={handleSelectChange}
                  isClearable
                  isSearchable
                  placeholder="Search for a game..."
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
              <label htmlFor="hoursPlayed" className="onboarding-game-label">
                <i className="fa-solid fa-clock onboarding-game-label-icon"></i>
                Hours played
              </label>
              <input
                type="number"
                className="onboarding-game-input"
                id="hoursPlayed"
                name="hours_played"
                value={game.hours_played}
                onChange={handleChange}
                placeholder="e.g., 42"
                min="1"
                max="10000"
              />
              {errorHoursPlayed && (
                <div className="onboarding-game-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  <span>{errorHoursPlayed}</span>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer onboarding-game-footer">
            <button
              type="button"
              className="btn onboarding-game-btn-cancel"
              data-bs-dismiss="modal"
              onClick={onCancel}
            >
              <i className="fa-solid fa-times"></i>
              Cancel
            </button>
            <button type="button" className="btn onboarding-game-btn-add" onClick={onSubmit}>
              <i className="fa-solid fa-plus"></i>
              Add Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
