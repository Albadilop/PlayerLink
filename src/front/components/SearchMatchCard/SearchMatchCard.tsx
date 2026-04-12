import "./SearchMatchCard.css";
import React, { useState } from "react";
import { getPhotoAsset, defaultPhoto } from "../../constants/photoAssets";
import { useAppSounds } from "../../hooks/useAppSounds";
import type { Profile } from "../../types";

interface SearchMatchCardProps {
  profile: Profile;
  onLike: () => void;
  onDislike: () => void;
}

export const SearchMatchCard: React.FC<SearchMatchCardProps> = ({ profile, onLike, onDislike }) => {
  const [animationClass, setAnimationClass] = useState<string>("");
  const { playSound } = useAppSounds();

  const selectPhoto = (): string => {
    return getPhotoAsset(profile.photo ?? "") || defaultPhoto;
  };

  const handleLike = () => {
    playSound("swipeRight");
    setAnimationClass("slide-out-right");
    setTimeout(() => {
      setAnimationClass("");
      onLike();
    }, 500);
  };

  const handleDislike = () => {
    playSound("swipeLeft");
    setAnimationClass("slide-out-left");
    setTimeout(() => {
      setAnimationClass("");
      onDislike();
    }, 500);
  };

  const formattedPreferences = profile?.preferences
    ? profile.preferences
        .replace(/\band\b/g, ",")
        .replace(/\.+$/, "")
        .split(",")
        .map((pref) => pref.trim())
        .filter(Boolean)
        .join(", ")
    : null;

  const formattedLanguages = profile?.language
    ? profile.language
        .replace(/\band\b/g, ",")
        .replace(/\.+$/, "")
        .split(",")
        .map((lang) => lang.trim())
        .filter(Boolean)
        .join(", ")
    : null;

  const topGames = profile?.games
    ? [...profile.games]
        .sort((a, b) => (b.gameHoursPlayed || 0) - (a.gameHoursPlayed || 0))
        .slice(0, 3)
    : [];

  return (
    <div className="d-flex justify-content-center">
      <div className={`search-match-card ${animationClass}`}>
        {/* Avatar con anillo */}
        <div className="search-match-avatar-wrapper">
          <div className="search-match-avatar-ring" />
          <img
            src={selectPhoto()}
            alt={`${profile?.nick_name || "User"} avatar`}
            className="search-match-profile-pic"
          />
        </div>

        {/* Nickname */}
        <h1 className="text-center search-match-name">
          {profile?.nick_name || "Unknown Player"}

          {profile?.location && (
            <span className="search-match-badge search-match-badge--location ms-3">
              <i className="fa-solid fa-location-dot icon-location" />
              {profile.location}
            </span>
          )}
        </h1>

        {/* Top Games — primero (después del nick) */}
        <div className="search-match-info-section search-match-info-section--games">
          <div className="search-match-section-header">
            <i className="fa-solid fa-gamepad icon-games" />
            Top Games
          </div>
          {topGames.length > 0 ? (
            topGames.map((game, index) => (
              <div className="game-row" key={index}>
                <span className="game-title">{game.gameTitle}</span>
                <span className="game-hours">{game.gameHoursPlayed}h</span>
              </div>
            ))
          ) : (
            <p className="no-data-text">
              <i className="fa-solid fa-ghost me-2" />
              No games yet
            </p>
          )}
        </div>

        {/* Quick Info Badges — contenedor con altura mínima para alinear tarjetas */}
        <div className="search-match-quick-info">
          {formattedLanguages ? (
            <span className="search-match-badge search-match-badge--languages">
              <span className="d-flex align-items-center">
                <i className="me-2 fa-solid fa-language icon-language" />

                {formattedLanguages}
              </span>
            </span>
          ) : (
            <span className="search-match-badge search-match-badge--languages search-match-badge--placeholder">
              <span className="d-flex align-items-center">
                <i className="me-2 fa-solid fa-language icon-language" />
                <span className="search-match-placeholder-label">Languages not set</span>
              </span>
            </span>
          )}
        </div>

        {/* Preferences — siempre visible para mantener la misma altura de tarjeta */}
        <div className="search-match-info-section search-match-info-section--preferences">
          <div className="search-match-section-header">
            <i className="fa-solid fa-heart icon-preferences" />
            Preferences
          </div>
          {formattedPreferences ? (
            <p className="preferences-text">{formattedPreferences}</p>
          ) : (
            <p className="no-data-text">
              <i className="fa-solid fa-ghost me-2" />
              No preferences listed
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="search-match-buttons">
          <button
            type="button"
            onClick={handleDislike}
            className="search-match-button search-match-dislike-btn-border"
            aria-label="Dislike"
          >
            <i className="fa-solid fa-xmark search-match-dislike" />
          </button>

          <button
            type="button"
            onClick={handleLike}
            className="search-match-button search-match-like-btn-border"
            aria-label="Like"
          >
            <i className="fa-solid fa-heart search-match-like" />
          </button>
        </div>
      </div>
    </div>
  );
};
