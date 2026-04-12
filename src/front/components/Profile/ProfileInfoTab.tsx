import React from "react";
import Select from "react-select";
import { GENDER_OPTIONS } from "../../constants";
import { formatPreferences, parsePreferences } from "../../utils/formatters";
import { GamingPreferencesModal } from "../ProfileModals/GamingPreferencesModal";
import { LanguageModal } from "../ProfileModals/LanguageModal";
import "./ProfileInfoTab.css";

export interface ProfileInfoTabProps {
  profile: {
    name: string;
    nick_name: string;
    age: number;
    gender: string;
    location: string;
    zodiac: string;
    discord: string;
    steam_id: string;
    languages: string;
    preferences: string;
    bio: string;
  };
  isEditing: boolean;
  selectedGamingPreferences: string[];
  selectedLanguages: string[];
  showGamingPreferencesModal: boolean;
  showLanguageModal: boolean;
  onInputChange: (field: string, value: string | number) => void;
  onGamingPreferencesChange: (preferences: string[]) => void;
  onLanguagesChange: (languages: string[]) => void;
  onShowGamingPreferencesModal: (show: boolean) => void;
  onShowLanguageModal: (show: boolean) => void;
  onSave?: () => void;
  onCancel?: () => void;
}

const zodiacSigns = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  profile,
  isEditing,
  selectedGamingPreferences,
  selectedLanguages,
  showGamingPreferencesModal,
  showLanguageModal,
  onInputChange,
  onGamingPreferencesChange,
  onLanguagesChange,
  onShowGamingPreferencesModal,
  onShowLanguageModal,
  onSave,
  onCancel,
}) => {
  const genders = [...GENDER_OPTIONS];

  // Convertir opciones a formato React Select
  const genderOptions = genders.map((g) => ({ value: g, label: g }));
  const zodiacOptions = zodiacSigns.map((z) => ({ value: z, label: z }));

  const handleGamingPreferencesSave = () => {
    onInputChange("preferences", formatPreferences(selectedGamingPreferences));
    onShowGamingPreferencesModal(false);
  };

  const handleLanguagesSave = () => {
    onInputChange("languages", formatPreferences(selectedLanguages));
    onShowLanguageModal(false);
  };

  return (
    <div className="info-section container">
      {/* Personal Information Section */}
      <div className="info-section-group">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="info-field-card">
              <label className="info-field-label">
                <i className="fa-solid fa-id-card"></i> Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => onInputChange("name", e.target.value)}
                  maxLength={11}
                  className="info-field-input"
                />
              ) : (
                <div className="info-field-value">{profile.name || "—"}</div>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="info-field-card">
              <label className="info-field-label">
                <i className="fa-solid fa-signature"></i> Nickname
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.nick_name}
                  onChange={(e) => onInputChange("nick_name", e.target.value)}
                  maxLength={11}
                  className="info-field-input"
                />
              ) : (
                <div className="info-field-value">{profile.nick_name || "—"}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="info-section-group">
        <div className="row g-3">
          <div className="col-md-2">
            <div className="info-field-card age-input-wrapper">
              <label className="info-field-label">
                <i className="fa-solid fa-cake-candles"></i> Age
              </label>
              {isEditing ? (
                <div className="age-input-container">
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => onInputChange("age", +e.target.value)}
                    max={120}
                    min={1}
                    className="info-field-input age-input"
                  />
                  <div className="age-spinner-buttons">
                    <button
                      type="button"
                      className="age-spinner-btn age-spinner-up"
                      onClick={() => {
                        if (profile.age < 120) {
                          onInputChange("age", profile.age + 1);
                        }
                      }}
                      aria-label="Increase age"
                    >
                      <i className="fa-solid fa-chevron-up"></i>
                    </button>
                    <button
                      type="button"
                      className="age-spinner-btn age-spinner-down"
                      onClick={() => {
                        if (profile.age > 1) {
                          onInputChange("age", profile.age - 1);
                        }
                      }}
                      aria-label="Decrease age"
                    >
                      <i className="fa-solid fa-chevron-down"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="info-field-value">{profile.age || "—"}</div>
              )}
            </div>
          </div>
          <div className="col-md-4">
            <div className="info-field-card">
              <label className="info-field-label">
                <i className="fa-solid fa-venus-mars"></i> Gender
              </label>
              {isEditing ? (
                <Select
                  className="info-field-select"
                  classNamePrefix="info-select"
                  options={genderOptions}
                  value={genderOptions.find((opt) => opt.value === profile.gender) || null}
                  onChange={(selected) => onInputChange("gender", selected?.value || "")}
                  isSearchable={false}
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
                          : "rgba(0, 240, 255, 0.3)",
                      borderRadius: "10px",
                      boxShadow: state.isFocused
                        ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 240, 255, 0.3), 0 0 25px rgba(0, 240, 255, 0.2), inset 0 0 10px rgba(0, 240, 255, 0.05)"
                        : state.isHovered
                          ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(143, 0, 255, 0.3)"
                          : "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 240, 255, 0.2)",
                      minHeight: "40px",
                      cursor: "pointer",
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
                  }}
                />
              ) : (
                <div className="info-field-value">{profile.gender || "—"}</div>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="info-field-card">
              <label className="info-field-label">
                <i className="fa-solid fa-star-and-crescent"></i> Zodiac
              </label>
              {isEditing ? (
                <Select
                  className="info-field-select"
                  classNamePrefix="info-select"
                  options={zodiacOptions}
                  value={zodiacOptions.find((opt) => opt.value === profile.zodiac) || null}
                  onChange={(selected) => onInputChange("zodiac", selected?.value || "")}
                  isSearchable={false}
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
                          : "rgba(0, 240, 255, 0.3)",
                      borderRadius: "10px",
                      boxShadow: state.isFocused
                        ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 240, 255, 0.3), 0 0 25px rgba(0, 240, 255, 0.2), inset 0 0 10px rgba(0, 240, 255, 0.05)"
                        : state.isHovered
                          ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(143, 0, 255, 0.3)"
                          : "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 240, 255, 0.2)",
                      minHeight: "40px",
                      cursor: "pointer",
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
                  }}
                />
              ) : (
                <div className="info-field-value">{profile.zodiac || "—"}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="info-section-group">
        <div className="row g-3">
          {(["discord", "steam_id"] as const).map((f, i) => (
            <div key={i} className="col-md-6">
              <div className="info-field-card">
                <label className="info-field-label ">
                  <i
                    className={f === "steam_id" ? "fa-brands fa-steam" : "fa-brands fa-discord"}
                  ></i>
                  {f === "steam_id" ? "Steam Friend ID" : "Discord"}
                  <span className="tooltip-wrapper ">
                    <i className="fa-solid fa-circle-info discord-info-icon "></i>
                    <span className="tooltip-text">
                      <strong>Connect with your matches</strong>
                      The Discord or Steam info in your profile will be used by your matches to
                      reach out to you.
                    </span>
                  </span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile[f]}
                    onChange={(e) => onInputChange(f, e.target.value)}
                    maxLength={30}
                    className="info-field-input"
                  />
                ) : (
                  <div className="info-field-value">{profile[f] || "—"}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences & Languages Section */}
      <div className="info-section-group">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="info-field-card gaming-prefs-box">
              <label className="info-field-label">
                <i className="fa-solid fa-gamepad"></i> Gaming Preferences
              </label>
              {isEditing ? (
                <>
                  <div className="section-container">
                    <button
                      onClick={() => onShowGamingPreferencesModal(true)}
                      className="section-button"
                    >
                      <i className="fa-solid fa-edit"></i> Select Preferences
                    </button>
                    {selectedGamingPreferences.length > 0 ? (
                      <div className="preferences-tags-container">
                        {selectedGamingPreferences.map((pref, index) => (
                          <span key={index} className="preference-tag">
                            {pref}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="info-field-value">No preferences selected yet.</div>
                    )}
                  </div>

                  {showGamingPreferencesModal && (
                    <GamingPreferencesModal
                      selected={selectedGamingPreferences}
                      setSelected={onGamingPreferencesChange}
                      onSave={handleGamingPreferencesSave}
                      onCancel={() => onShowGamingPreferencesModal(false)}
                    />
                  )}
                </>
              ) : (
                <>
                  {profile.preferences && profile.preferences.trim().length > 0 ? (
                    <div className="preferences-tags-container">
                      {parsePreferences(profile.preferences).map((pref, index) => (
                        <span key={index} className="preference-tag">
                          {pref}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="info-field-value">No preferences selected yet.</div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="info-field-card">
              <label className="info-field-label">
                <i className="fa-solid fa-language"></i> Languages
              </label>
              {isEditing ? (
                <>
                  <div className="section-container">
                    <button onClick={() => onShowLanguageModal(true)} className="section-button">
                      <i className="fa-solid fa-edit"></i> Select Languages
                    </button>
                    {selectedLanguages.length > 0 ? (
                      <div className="preferences-tags-container">
                        {selectedLanguages.map((lang, index) => (
                          <span key={index} className="preference-tag">
                            {lang}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="info-field-value">No languages selected.</div>
                    )}
                  </div>

                  {showLanguageModal && (
                    <LanguageModal
                      selected={selectedLanguages}
                      setSelected={onLanguagesChange}
                      onSave={handleLanguagesSave}
                      onCancel={() => onShowLanguageModal(false)}
                    />
                  )}
                </>
              ) : (
                <>
                  {profile.languages && profile.languages.trim().length > 0 ? (
                    <div className="preferences-tags-container">
                      {parsePreferences(profile.languages).map((lang, index) => (
                        <span key={index} className="preference-tag">
                          {lang}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="info-field-value">No languages selected.</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Button */}
      {onSave && (
        <div className="info-section-actions">
          <button className="edit-btn" onClick={onSave}>
            <i className={isEditing ? "fa-solid fa-save" : "fa-solid fa-edit"}></i>
            {isEditing ? "Save Changes" : "Edit Profile"}
          </button>
          {isEditing && onCancel && (
            <button type="button" className="cancel-btn" onClick={onCancel}>
              <i className="fa-solid fa-times" aria-hidden />
              <span className="cancel-btn-label">Cancel</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
