import React from "react";
import { createPortal } from "react-dom";
import "./ProfileModals.css";
import { MAX_PROFILE_LANGUAGES } from "../../utils/profileLanguages";

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Japanese",
  "Korean",
  "Chinese",
  "Mandalorian",
  "Thalassian",
  "Klingon",
  "Sindarin",
  "Renegade",
  "Orcish",
];

interface LanguageModalProps {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: () => void;
  onCancel: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  selected,
  setSelected,
  onSave,
  onCancel,
}) => {
  const toggleLanguage = (language: string) => {
    setSelected((prev) => {
      if (prev.includes(language)) {
        return prev.filter((item) => item !== language);
      } else if (prev.length < MAX_PROFILE_LANGUAGES) {
        return [...prev, language];
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
          Select up to 4 Languages
          <span className="preferences-counter">
            ({selected.length}/{MAX_PROFILE_LANGUAGES})
          </span>
        </h3>
        <div className="abcheckbox-grid">
          {languages.map((language) => (
            <label key={language} className="abcheckbox-label">
              <input
                type="checkbox"
                checked={selected.includes(language)}
                onChange={() => toggleLanguage(language)}
              />
              {language}
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
