import "./SearchMatchCard.css";
import React, { useEffect, useState } from "react";
import searchMatchServices from "../../services/searchMatchServices";
import { getPhotoAsset, defaultPhoto } from "../../constants/photoAssets";
import { GameImage } from "../GameImage";
import type { Profile } from "../../types";

interface SearchMatchCardProps {
  profile: Profile;
  onLike: () => void;
  onDislike: () => void;
}

export const SearchMatchCard: React.FC<SearchMatchCardProps> = ({ profile, onLike, onDislike }) => {
  const [animationClass, setAnimationClass] = useState<string>("");
  const [avgStars, setAvgStars] = useState<number>(0);

  const selectPhoto = (): string => {
    return getPhotoAsset(profile.photo) || defaultPhoto;
  };

  useEffect(() => {
    if (!profile?.id) return;
    const getAvgStars = async () => {
      try {
        const average = await searchMatchServices.getStarsByUser(profile.id);
        setAvgStars(Number(average));
      } catch (err) {
        console.error(err);
      }
    };
    getAvgStars();
  }, [profile]);

  const handleLike = () => {
    setAnimationClass("slide-out-right");
    setTimeout(() => {
      setAnimationClass("");
      onLike();
    }, 500);
  };

  const handleDislike = () => {
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
        <h1 className="text-center search-match-name">{profile?.nick_name || "Unknown Player"}</h1>

        {/* Stars Rating */}
        <div className="search-match-stars-container">
          {[...Array(5)].map((_, i) => (
            <i
              key={i}
              className={`fa-star search-match-stars ${
                i < Math.round(avgStars) ? "fa-solid" : "fa-regular"
              }`}
            />
          ))}
        </div>

        {/* Quick Info Badges */}
        <div className="search-match-quick-info">
          {profile?.location && (
            <span className="search-match-badge">
              <i className="fa-solid fa-location-dot icon-location" />
              {profile.location}
            </span>
          )}
          {formattedLanguages && (
            <span className="search-match-badge">
              <i className="fa-solid fa-language icon-language" />
              {formattedLanguages}
            </span>
          )}
        </div>

        <hr className="search-match-line" />

        {/* Games Section */}
        <div className="search-match-info-section">
          <div className="search-match-section-header">
            <i className="fa-solid fa-gamepad icon-games" />
            Top Games
          </div>
          {topGames.length > 0 ? (
            topGames.map((game, index) => (
              <div className="game-row" key={index}>
                <GameImage
                  gameTitle={game.gameTitle}
                  gameImage={game.gameImage}
                  className="game-image"
                  alt={game.gameTitle}
                  rawgApiKey={import.meta.env.VITE_RAWG_KEY || null}
                />
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

        {/* Preferences Section */}
        {formattedPreferences && (
          <div className="search-match-info-section">
            <div className="search-match-section-header">
              <i className="fa-solid fa-heart icon-preferences" />
              Preferences
            </div>
            <p className="preferences-text">{formattedPreferences}</p>
          </div>
        )}

        <hr className="search-match-last-line" />

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
