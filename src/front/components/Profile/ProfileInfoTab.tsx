import React from "react";
import Select from "react-select";
import { DEFAULT_VALUES, GENDER_OPTIONS, PROFILE_FIELD_LIMITS } from "../../constants";
import { formatPreferences, parsePreferences } from "../../utils/formatters";
import { profileInfoSelectStyles } from "../../utils/profileInfoSelectStyles";
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
  onGamingPreferencesChange: React.Dispatch<React.SetStateAction<string[]>>;
  onLanguagesChange: React.Dispatch<React.SetStateAction<string[]>>;
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
  const t = (v: string | undefined | null) => (v ?? "").trim();

  const emptyName = t(profile.name).length < 1;
  const emptyNick = t(profile.nick_name).length < 1;
  const emptyAge = !profile.age || profile.age < 1;
  const gTrim = t(profile.gender);
  const emptyGender =
    gTrim.length < 1 ||
    gTrim.toLowerCase() === "undefined" ||
    gTrim.toLowerCase() === DEFAULT_VALUES.GENDER_UNDEFINED.toLowerCase() ||
    gTrim === DEFAULT_VALUES.GENDER;
  const emptyZodiac = t(profile.zodiac).length < 1;
  const emptyLocation = t(profile.location).length < 2;
  const emptyDiscord = t(profile.discord).length < 1;
  const emptySteam = t(profile.steam_id).length < 1;
  const emptyPreferences = isEditing
    ? selectedGamingPreferences.length === 0
    : !t(profile.preferences) || parsePreferences(profile.preferences).length === 0;
  const emptyLanguages = isEditing
    ? selectedLanguages.length === 0
    : !t(profile.languages) || parsePreferences(profile.languages).length === 0;

  const freeze = (isEmpty: boolean) => (isEmpty ? " info-field-card--frozen" : "");

  /** Modo lectura: sin placeholder dentro del recuadro si no hay dato. */
  const displayValue = (text: string) =>
    t(text) ? <div className="info-field-value">{text.trim()}</div> : null;

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
    <div className="info-section container profile-info-tab-root">
      <div className="row justify-content-between align-items-center mb-0 profile-tab-toolbar">
        <div className="col-auto">
          <h3 className="m-0 d-flex align-items-center gap-2 flex-wrap profile-tab-title">
            <span className="d-flex align-items-center gap-2">
              <i className="fa-solid fa-user section-title-icon" aria-hidden />
              Info
            </span>
          </h3>
        </div>
        {onSave && (
          <div className="col-auto profile-tab-toolbar-actions info-section-actions info-section-actions--toolbar">
            <button className="edit-btn" type="button" onClick={onSave}>
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
      {/* Personal Information Section */}
      <div className="info-section-group">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className={`info-field-card${freeze(emptyName)}`}>
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
                displayValue(profile.name)
              )}
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className={`info-field-card${freeze(emptyNick)}`}>
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
                displayValue(profile.nick_name)
              )}
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className={`info-field-card${freeze(emptyLocation)}`}>
              <label className="info-field-label">
                <i className="fa-solid fa-location-dot" /> Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => onInputChange("location", e.target.value)}
                  maxLength={PROFILE_FIELD_LIMITS.LOCATION_MAX}
                  className="info-field-input"
                  placeholder="City or country"
                />
              ) : (
                displayValue(profile.location)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="info-section-group">
        <div className="row g-3">
          <div className="col-md-2">
            <div className={`info-field-card age-input-wrapper${freeze(emptyAge)}`}>
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
              ) : !emptyAge ? (
                <div className="info-field-value">{profile.age}</div>
              ) : null}
            </div>
          </div>
          <div className="col-md-4">
            <div className={`info-field-card${freeze(emptyGender)}`}>
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
                  styles={profileInfoSelectStyles}
                />
              ) : !emptyGender ? (
                <div className="info-field-value">{profile.gender}</div>
              ) : null}
            </div>
          </div>
          <div className="col-md-6">
            <div className={`info-field-card${freeze(emptyZodiac)}`}>
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
                  styles={profileInfoSelectStyles}
                />
              ) : (
                displayValue(profile.zodiac)
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
              <div
                className={`info-field-card${freeze(f === "discord" ? emptyDiscord : emptySteam)}`}
              >
                <label className="info-field-label ">
                  <i
                    className={f === "steam_id" ? "fa-brands fa-steam" : "fa-brands fa-discord"}
                  ></i>
                  {f === "steam_id" ? "Steam Friend ID" : "Discord"}
                  <span className="tooltip-wrapper">
                    <button
                      type="button"
                      className="discord-info-tooltip-trigger"
                      aria-label="How your matches use Discord and Steam"
                    >
                      <i className="fa-solid fa-circle-info discord-info-icon" aria-hidden />
                    </button>
                    <span className="tooltip-text" role="tooltip">
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
                  displayValue(profile[f])
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
            <div className={`info-field-card gaming-prefs-box${freeze(emptyPreferences)}`}>
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
                    ) : null}
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
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className={`info-field-card${freeze(emptyLanguages)}`}>
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
                    ) : null}
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
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
