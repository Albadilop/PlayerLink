import React from 'react';
import { GENDER_OPTIONS } from '../../constants';
import { formatPreferences, parsePreferences } from '../../utils/formatters';
import { GamingPreferencesModal } from '../ProfileModals/GamingPreferencesModal';
import { LanguageModal } from '../ProfileModals/LanguageModal';
import './ProfileInfoTab.css';

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
  onSave: () => void;
}

const zodiacSigns = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
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
}) => {
  const genders = [...GENDER_OPTIONS];

  const handleGamingPreferencesSave = () => {
    onInputChange('preferences', formatPreferences(selectedGamingPreferences));
    onShowGamingPreferencesModal(false);
  };

  const handleLanguagesSave = () => {
    onInputChange('languages', formatPreferences(selectedLanguages));
    onShowLanguageModal(false);
  };

  return (
    <div className="info-section container">
      {/* Nombre y Nickname */}
      <div className="row">
        {(['name', 'nick_name'] as const).map((f, i) => (
          <div key={i} className="col-md-6">
            <label>{f === 'nick_name' ? 'Nickname' : 'Name'}</label>
            {isEditing ? (
              <input
                type="text"
                value={profile[f]}
                onChange={e => onInputChange(f, e.target.value)}
                maxLength={11}
              />
            ) : (
              <p>{profile[f]}</p>
            )}
          </div>
        ))}
      </div>
      {/* Age, Gender, Zodiac */}
      <div className="row">
        <div className="col-md-4">
          <label>Age</label>
          {isEditing ? (
            <input
              type="number"
              value={profile.age}
              onChange={e => onInputChange('age', +e.target.value)}
              max={120}
              min={1}
            />
          ) : (
            <p>{profile.age}</p>
          )}
        </div>
        <div className="col-md-4">
          <label>Gender</label>
          {isEditing ? (
            <select
              value={profile.gender}
              onChange={e => onInputChange('gender', e.target.value)}
            >
              {genders.map((g, idx) => <option key={idx}>{g}</option>)}
            </select>
          ) : (
            <p>{profile.gender}</p>
          )}
        </div>
        <div className="col-md-4">
          <label>Zodiac</label>
          {isEditing ? (
            <select
              value={profile.zodiac}
              onChange={e => onInputChange('zodiac', e.target.value)}
            >
              {zodiacSigns.map((z, idx) => <option key={idx}>{z}</option>)}
            </select>
          ) : (
            <p>{profile.zodiac}</p>
          )}
        </div>
      </div>
      {/* Contacto y preferencias */}
      <div className="row">
        {(['discord', 'steam_id'] as const).map((f, i) => (
          <div key={i} className="col-md-6">
            <label className="d-flex align-items-center gap-2 mt-1 mb-1">
              {f === 'steam_id' ? 'Steam Friend ID' : 'Discord'}
              <div>
                <span className="tooltip-wrapper">
                  <i className="fa-solid fa-circle-info fa-xl discord-info-icon"></i>
                  <span className="tooltip-text discord-info-tooltip-text">
                    <strong>Connect with your matches</strong>
                    <div>
                      The Discord or Steam info<br />
                      in your profile will be <br />
                      used by your matches<br />
                      to reach out to you.
                    </div>
                  </span>
                </span>
              </div>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile[f]}
                onChange={e => onInputChange(f, e.target.value)}
                maxLength={30}
              />
            ) : (
              <p>{profile[f]}</p>
            )}
          </div>
        ))}
        {/* MODAL DE PREFERENCES----------------------- */}
        <div className="gaming-prefs-box col-md-6">
          <label>Gaming Preferences</label>
          {isEditing ? (
            <>
              <div className="section-container">
                <button
                  onClick={() => onShowGamingPreferencesModal(true)}
                  className="section-button"
                >
                  Select Preferences
                </button>
                <p>
                  {selectedGamingPreferences.length > 0
                    ? formatPreferences(selectedGamingPreferences)
                    : "No preferences selected yet."}
                </p>
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
            <p>
              {profile.preferences && profile.preferences.trim().length > 0
                ? profile.preferences
                : "No preferences selected yet."}
            </p>
          )}
        </div>

        <div className="col-md-6">
          <label>Location</label>
          {isEditing ? (
            <input
              type="text"
              value={profile.location}
              onChange={e => onInputChange('location', e.target.value)}
              maxLength={20}
              minLength={4}
            />
          ) : (
            <p>{profile.location}</p>
          )}
        </div>
        <div className="col-md-12">
          <div className="form-group">
            <label className="">Languages</label>
            {isEditing ? (
              <>
                <div className="section-container">
                  <button
                    onClick={() => onShowLanguageModal(true)}
                    className="section-button"
                  >
                    Select Languages
                  </button>
                  <p style={{ minHeight: "38px" }}>
                    {selectedLanguages.length > 0
                      ? formatPreferences(selectedLanguages)
                      : "No languages selected."}
                  </p>
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
              <p style={{ minHeight: "38px" }}>
                {profile.languages ? profile.languages : "No languages selected."}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="row mt-3">
        <div className="col text-left">
          <button className="edit-btn" onClick={onSave}>
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>
      </div>
    </div>
  );
};

