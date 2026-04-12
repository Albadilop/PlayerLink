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
    const popoverInstances: any[] = [];
    const cleanupFunctions: (() => void)[] = [];

    // Limpiar popovers anteriores
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      if (window.bootstrap?.Popover) {
        const existingPopover = window.bootstrap.Popover.getInstance(el);
        if (existingPopover) {
          existingPopover.dispose();
        }
      }
    });

    // Inicializar nuevos popovers
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      if (window.bootstrap?.Popover) {
        const popover = new window.bootstrap.Popover(el, {
          trigger: "hover focus",
          delay: { show: 200, hide: 150 },
          html: true,
        });
        popoverInstances.push(popover);

        let hideTimeout: ReturnType<typeof setTimeout> | null = null;

        // Asegurar que el popover se oculte al salir del elemento
        const handleMouseLeave = () => {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
          }
          hideTimeout = setTimeout(() => {
            if (popover) {
              popover.hide();
            }
          }, 150);
        };

        // Mostrar popover al entrar
        const handleMouseEnter = () => {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }
        };

        el.addEventListener("mouseleave", handleMouseLeave);
        el.addEventListener("mouseenter", handleMouseEnter);

        // Ocultar popover al hacer clic fuera
        const handleClickOutside = (e: MouseEvent) => {
          const target = e.target as Node;
          const popoverElement = document.querySelector(".popover");
          if (el && !el.contains(target) && popoverElement && !popoverElement.contains(target)) {
            popover.hide();
          }
        };

        document.addEventListener("click", handleClickOutside);

        // Guardar funciones de cleanup
        cleanupFunctions.push(() => {
          el.removeEventListener("mouseleave", handleMouseLeave);
          el.removeEventListener("mouseenter", handleMouseEnter);
          document.removeEventListener("click", handleClickOutside);
          if (hideTimeout) {
            clearTimeout(hideTimeout);
          }
        });
      }
    });

    // Cleanup al desmontar o cuando cambien los games
    return () => {
      popoverInstances.forEach((popover) => {
        if (popover) {
          try {
            // Intentar ocultar primero
            try {
              popover.hide();
            } catch {
              // Ignorar si ya está oculto o el elemento no existe
            }
            // Intentar dispose con manejo de errores
            try {
              popover.dispose();
            } catch {
              // Ignorar errores si el elemento ya no existe en el DOM
              // Esto puede pasar cuando React desmonta el componente rápidamente
            }
          } catch {
            // Ignorar cualquier otro error durante el cleanup
          }
        }
      });
      cleanupFunctions.forEach((cleanup) => {
        try {
          cleanup();
        } catch {
          // Ignorar errores en las funciones de cleanup
        }
      });
    };
  }, [games]);

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

  const handleCardClick = () => {
    if (id !== undefined && id !== null) {
      const userId = String(id);
      navigate(`/private/your-matches/matchDetails/${userId}`);
    } else {
      console.error("MatchMiniCard: id is undefined or null", { id, nickname });
    }
  };

  return (
    <div
      className="match-mini-card"
      onClick={handleCardClick}
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
