import React from "react";
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
          {(["name", "nick_name"] as const).map((f, i) => (
            <div key={i} className="col-md-6">
              <div className="info-field-card">
                <label className="info-field-label">
                  <i
                    className={f === "nick_name" ? "fa-solid fa-signature" : "fa-solid fa-id-card"}
                  ></i>
                  {f === "nick_name" ? "Nickname" : "Name"}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile[f]}
                    onChange={(e) => onInputChange(f, e.target.value)}
                    maxLength={11}
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

      {/* Demographics Section */}
      <div className="info-section-group">
        <div className="row g-3">
          <div className="col-md-3">
            <div className="info-field-card">
              <label className="info-field-label">
                <i className="fa-solid fa-cake-candles"></i> Age
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => onInputChange("age", +e.target.value)}
                  max={120}
                  min={1}
                  className="info-field-input"
                />
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
                <select
                  value={profile.gender}
                  onChange={(e) => onInputChange("gender", e.target.value)}
                  className="info-field-input"
                >
                  {genders.map((g, idx) => (
                    <option key={idx}>{g}</option>
                  ))}
                </select>
              ) : (
                <div className="info-field-value">{profile.gender || "—"}</div>
              )}
            </div>
          </div>
          <div className="col-md-5">
            <div className="info-field-card">
              <label className="info-field-label">
                <i className="fa-solid fa-star-and-crescent"></i> Zodiac
              </label>
              {isEditing ? (
                <select
                  value={profile.zodiac}
                  onChange={(e) => onInputChange("zodiac", e.target.value)}
                  className="info-field-input"
                >
                  {zodiacSigns.map((z, idx) => (
                    <option key={idx}>{z}</option>
                  ))}
                </select>
              ) : (
                <div className="info-field-value">{profile.zodiac || "—"}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location & Contact Section */}
      <div className="info-section-group">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="info-field-card">
              <label className="info-field-label">
                <i className="fa-solid fa-map-marker-alt"></i> Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => onInputChange("location", e.target.value)}
                  maxLength={20}
                  minLength={4}
                  className="info-field-input"
                />
              ) : (
                <div className="info-field-value">{profile.location || "—"}</div>
              )}
            </div>
          </div>
          {(["discord", "steam_id"] as const).map((f, i) => (
            <div key={i} className="col-md-6">
              <div className="info-field-card">
                <label className="info-field-label">
                  <i
                    className={f === "steam_id" ? "fa-brands fa-steam" : "fa-brands fa-discord"}
                  ></i>
                  {f === "steam_id" ? "Steam Friend ID" : "Discord"}
                  <span className="tooltip-wrapper">
                    <i className="fa-solid fa-circle-info discord-info-icon"></i>
                    <span className="tooltip-text discord-info-tooltip-text">
                      <strong>Connect with your matches</strong>
                      <div>
                        The Discord or Steam info
                        <br />
                        in your profile will be <br />
                        used by your matches
                        <br />
                        to reach out to you.
                      </div>
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
            <button className="cancel-btn" onClick={onCancel}>
              <i className="fa-solid fa-times"></i> Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};
