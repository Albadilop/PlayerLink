import React, { useEffect } from "react";
import "./matchMiniCard.css";
import goldMedal from "../assets/img/medals/gold-medal.png";
import silverMedal from "../assets/img/medals/silver-medal.png";
import bronzeMedal from "../assets/img/medals/bronze-medal.png";
import { useNavigate } from "react-router-dom";
import { getPhotoAsset, defaultPhoto } from "../constants/photoAssets";
import { GameImage } from "./GameImage";
import type { Game } from "../types";

interface MatchMiniCardProps {
  id: number | string;
  nickname: string;
  gender: string;
  games: Game[];
  age: number | string;
  location: string;
  photo?: string;
  index?: number;
}

declare global {
  interface Window {
    bootstrap: typeof import("bootstrap");
  }
}

export const MatchMiniCard: React.FC<MatchMiniCardProps> = ({
  id,
  nickname,
  gender,
  games,
  age,
  location,
  photo,
  index = 0,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      if (window.bootstrap?.Popover) {
        new window.bootstrap.Popover(el);
      }
    });
  }, []);

  const topThreeGames = games
    ? [...games].sort((a, b) => (b.gameHoursPlayed || 0) - (a.gameHoursPlayed || 0)).slice(0, 3)
    : [];

  const selectMedal = (gamehours: number | string): string => {
    const hours = typeof gamehours === "string" ? parseInt(gamehours, 10) : gamehours;
    if (isNaN(hours)) return bronzeMedal;
    if (hours >= 2500) return goldMedal;
    if (hours >= 500) return silverMedal;
    return bronzeMedal;
  };

  const avatarSrc = photo ? getPhotoAsset(photo) : defaultPhoto;

  return (
    <div
      className="match-mini-card"
      onClick={() => navigate(`matchDetails/${id}`)}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Efecto de brillo */}
      <div className="match-mini-glow" />

      <div className="match-mini-content">
        {/* Header con avatar y nombre */}
        <div className="match-mini-header">
          <div className="match-mini-avatar-wrapper">
            <div className="match-mini-avatar-ring" />
            <img src={avatarSrc} alt={`${nickname}'s avatar`} className="match-mini-avatar" />
          </div>

          <div className="match-mini-info">
            <h3 className="match-mini-nickname">{nickname || "Unknown"}</h3>
            <div className="match-mini-details">
              <span className="match-mini-badge">
                <i className="fa-solid fa-user" />
                {gender} • {age}
              </span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="match-mini-location">
          <i className="fa-solid fa-location-dot" />
          <span>{location || "Unknown location"}</span>
        </div>

        {/* Games Section */}
        <div className="match-mini-games">
          {topThreeGames.length > 0 ? (
            <div className="match-mini-games-grid">
              {topThreeGames.map((game, idx) => (
                <div key={game.id || idx} className="match-mini-game-item">
                  <GameImage
                    gameTitle={game.gameTitle}
                    gameImage={game.gameImage}
                    className="match-mini-game-img"
                    alt={game.gameTitle}
                    rawgApiKey={import.meta.env.VITE_RAWG_KEY || null}
                  />
                  <img
                    src={selectMedal(game.gameHoursPlayed)}
                    alt="Medal"
                    className="match-mini-medal"
                    role="button"
                    data-bs-toggle="popover"
                    data-bs-trigger="hover focus"
                    data-bs-container="body"
                    data-bs-placement="bottom"
                    data-bs-html="true"
                    data-bs-content={`${game.gameTitle} — <span class="popover-hours">${game.gameHoursPlayed}h</span>`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="match-mini-no-games">
              <i className="fa-solid fa-gamepad" />
              <span>No games yet</span>
            </div>
          )}
        </div>

        {/* View Profile hint */}
        <div className="match-mini-cta">
          <span>View Profile</span>
          <i className="fa-solid fa-arrow-right" />
        </div>
      </div>
    </div>
  );
};
