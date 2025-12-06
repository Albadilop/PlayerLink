import React from 'react';
import Select from 'react-select';
import './GameForm.css';

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
    onChange(name as keyof GameFormData, name === 'hours_played' ? Number(value) : value);
  };

  const handleSelectChange = (selected: SelectOption | null) => {
    onChange('title', selected?.value || '');
  };

  return (
    <div className="modal fade" id="commentModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content modal-sci-fi">
          <div className="modal-header modal-sci-fi-header">
            <h5 className="modal-title modal-sci-fi-title" id="commentModalLabel">
              Add a new game
            </h5>
            <button
              type="button"
              className="btn-close btn-sci-fi"
              data-bs-dismiss="modal"
              aria-label="Cerrar"
            />
          </div>
          <div className="modal-body modal-sci-fi-body">
            <div className="mb-3">
              <label htmlFor="gameName" className="label-sci-fi">
                Select a game
              </label>
              <Select
                id="gameName"
                className="selectorJuegos"
                options={gameOptions}
                value={gameOptions.find(opt => opt.value === game.title) || null}
                onChange={handleSelectChange}
                isClearable
                isSearchable
                placeholder="-- Select a game --"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="hoursPlayed" className="label-sci-fi">
                Hours played
              </label>
              <input
                type="number"
                className="input-sci-fi"
                id="hoursPlayed"
                name="hours_played"
                value={game.hours_played}
                onChange={handleChange}
                placeholder="Eg.: 42"
                min="1"
                max="10000"
              />
              {errorHoursPlayed && (
                <h6 className="text-danger ms-2 mt-2">{errorHoursPlayed}</h6>
              )}
              {errorRepeatedGame && (
                <h6 className="text-danger ms-2 mt-2">{errorRepeatedGame}</h6>
              )}
            </div>
          </div>
          <div className="modal-footer modal-sci-fi-footer">
            <button
              type="button"
              className="btn-sci-fi-primary"
              data-bs-dismiss="modal"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-sci-fi-primary"
              onClick={onSubmit}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

