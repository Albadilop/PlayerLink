// MatchMiniCard.tsx
import React, { useEffect } from "react";
import "./matchMiniCard.css";
import goldMedal from "../assets/img/medals/gold-medal.png";
import silverMedal from "../assets/img/medals/silver-medal.png";
import bronzeMedal from "../assets/img/medals/bronze-medal.png";
import { useNavigate } from "react-router-dom";
import type { Game } from "../types";

interface MatchMiniCardProps {
  id: number | string;
  nickname: string;
  gender: string;
  games: Game[];
  age: number;
  location: string;
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
}) => {
  useEffect(() => {
    // Selecciona todas las imágenes con data-bs-toggle="popover" y crea un Popover de Bootstrap para cada una
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      if (window.bootstrap?.Popover) {
        new window.bootstrap.Popover(el);
      }
    });
  }, []); // Se ejecuta solo al montar

  const navigate = useNavigate();

  // Dentro del componente (antes del return), calcula los 3 juegos con más horas:
  const topThreeGames = games
    ? [...games].sort((a, b) => (b.gameHoursPlayed || 0) - (a.gameHoursPlayed || 0)).slice(0, 3)
    : [];

  const selectMedal = (gamehours: number | string): string => {
    const hours = typeof gamehours === "string" ? parseInt(gamehours, 10) : gamehours;
    if (isNaN(hours)) {
      return bronzeMedal;
    }
    if (hours >= 2500) {
      return goldMedal;
    } else if (hours >= 500) {
      return silverMedal;
    } else {
      return bronzeMedal;
    }
  };

  return (
    <div className="card h-100 w-100 matchCardd" onClick={() => navigate(`matchDetails/${id}`)}>
      <div className="card-body d-flex flex-column p-3">
        {/* Nickname */}
        <div className="mb-2">
          <h5 className="match-card-nickname text-truncate mb-0">{nickname}</h5>
        </div>

        {/* Info del usuario */}
        <div className="row match-card-info mb-3">
          <div className="col-12 col-lg-6 d-flex align-items-center mb-1">
            <span className="fa-solid fa-location-dot me-2 match-card-location"></span>
            <span className="text-truncate">{location}</span>
          </div>
          <div className="col-12 col-lg-6 d-flex align-items-center mb-1">
            <span className="fa-solid fa-user me-2"></span>
            <span>
              {gender} • {age}
            </span>
          </div>
        </div>

        {/* Games y Medallas */}
        <div className="flex-grow-1 medalsBox rounded">
          {topThreeGames && topThreeGames.length > 0 ? (
            <div className="d-flex flex-row flex-nowrap justify-content-around align-items-center">
              {topThreeGames.map((el, index) => (
                <div
                  key={el.id || index}
                  className="d-flex flex-column justify-content-center align-items-center mx-1"
                >
                  <img
                    src={el.gameImage}
                    className="img-fluid imagenminicard mb-1"
                    style={{ width: "80px", height: "45px", objectFit: "cover" }}
                    alt={el.gameTitle}
                  />
                  <img
                    src={selectMedal(el.gameHoursPlayed)}
                    className="img-fluid medal-img"
                    style={{ width: "2.5rem", height: "auto" }}
                    alt="Medal"
                    role="button"
                    data-bs-toggle="popover"
                    data-bs-trigger="hover focus"
                    data-bs-container="body"
                    data-bs-placement="bottom"
                    data-bs-content={`${el.gameTitle} — ${el.gameHoursPlayed} hours`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center no-games-text mb-0">
              <i className="fa-solid fa-gamepad me-2"></i>
              No games yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
