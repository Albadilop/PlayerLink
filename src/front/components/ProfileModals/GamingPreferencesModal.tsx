import React from "react";
import { createPortal } from "react-dom";
import "./ProfileModals.css";

const options = [
  "Tryhard",
  "Chill",
  "Adventurer",
  "Pro",
  "Competitive",
  "Creative",
  "MOBA",
  "PMA",
  "Designer",
  "Conversational",
  "Strategic",
  "Emotional",
  "Excited",
  "Horror",
  "Online Cooperative",
  "Co-op Campaign",
  "Survival",
  "Construction",
  "God mode",
];

interface GamingPreferencesModalProps {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: () => void;
  onCancel: () => void;
}

export const GamingPreferencesModal: React.FC<GamingPreferencesModalProps> = ({
  selected,
  setSelected,
  onSave,
  onCancel,
}) => {
  const toggleOption = (option: string) => {
    setSelected((prev) => {
      if (prev.includes(option)) {
        return prev.filter((item) => item !== option);
      } else if (prev.length < 5) {
        return [...prev, option];
      }
      return prev;
    });
  };

  const handleSaveAndClose = () => {
    onSave();
    onCancel();
  };

  const modalContent = (
    <div className="abmodal">
      <div className="abmodal-content">
        <h3>
          Select up to 5 Gaming Preferences
          <span className="text-medium preferences-counter">({selected.length}/5)</span>
        </h3>
        <div className="abcheckbox-grid">
          {options.map((option) => (
            <label key={option} className="abcheckbox-label">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              {option}
            </label>
          ))}
        </div>
        <div className="abmodal-buttons">
          <button onClick={handleSaveAndClose}>Add</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
