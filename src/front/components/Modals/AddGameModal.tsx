import React from "react";
import { createPortal } from "react-dom";
import Select from "react-select";
import "../Onboarding/Onboarding.css";

export interface GameFormData {
  title: string;
  hours_played: number | string;
  image: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface AddGameModalProps {
  isOpen: boolean;
  game: GameFormData;
  gameOptions: SelectOption[];
  errorRepeatedGame?: string;
  errorHoursPlayed?: string;
  isLoading?: boolean;
  onGameChange: (field: keyof GameFormData, value: string | number) => void;
  onHoursChange: (hours: number) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  game,
  gameOptions,
  errorRepeatedGame,
  errorHoursPlayed,
  isLoading = false,
  onGameChange,
  onHoursChange,
  onAdd,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleSelectChange = (selected: SelectOption | null) => {
    onGameChange("title", selected?.value || "");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    onHoursChange(value);
  };

  const handleIncreaseHours = () => {
    const currentValue = Number(game.hours_played) || 0;
    if (currentValue < 10000) {
      onHoursChange(currentValue + 1);
    }
  };

  const handleDecreaseHours = () => {
    const currentValue = Number(game.hours_played) || 0;
    if (currentValue > 1) {
      onHoursChange(currentValue - 1);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={handleOverlayClick}>
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
            onClick={onCancel}
            aria-label="Close modal"
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
                onChange={handleSelectChange}
                isSearchable
                isClearable
                isLoading={isLoading}
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
                    backgroundColor: state.isFocused ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.4)",
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
                onChange={handleInputChange}
                placeholder="e.g., 42"
                min={1}
                max={10000}
              />
              <div className="hours-spinner-buttons">
                <button
                  type="button"
                  className="hours-spinner-btn hours-spinner-up"
                  onClick={handleIncreaseHours}
                  aria-label="Increase hours"
                >
                  <i className="fa-solid fa-chevron-up"></i>
                </button>
                <button
                  type="button"
                  className="hours-spinner-btn hours-spinner-down"
                  onClick={handleDecreaseHours}
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
          <button type="button" className="btn onboarding-game-btn-add" onClick={onAdd}>
            <i className="fa-solid fa-plus"></i>
            Add Game
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
