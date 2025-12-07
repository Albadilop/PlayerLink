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
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
                      borderColor: state.isFocused
                        ? "#00f0ff"
                        : state.isHovered
                          ? "#8f00ff"
                          : "#7f00ff",
                      borderRadius: "10px",
                      boxShadow: state.isFocused
                        ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 240, 255, 0.4), 0 0 25px rgba(0, 240, 255, 0.2)"
                        : state.isHovered
                          ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(143, 0, 255, 0.3)"
                          : "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(127, 0, 255, 0.2)",
                      minHeight: "48px",
                      cursor: "pointer",
                      "&:hover": {
                        borderColor: "#8f00ff",
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
