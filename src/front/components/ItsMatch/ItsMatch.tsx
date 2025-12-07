import React from "react";
import "./ItsMatch.css";
import { useNavigate } from "react-router-dom";
import { getPhotoAsset, defaultPhoto } from "../../constants/photoAssets";
import type { Profile } from "../../types";

interface ItsMatchProps {
  profile: Profile;
}

export const ItsMatch: React.FC<ItsMatchProps> = ({ profile }) => {
  const navigate = useNavigate();

  if (!profile) return null;

  const handleClick = () => {
    // Navegar directamente al perfil del match
    const userId = profile?.user_id || profile?.id;
    if (userId) {
      navigate(`/private/your-matches/matchDetails/${userId}`);
    } else {
      navigate("/private/your-matches/");
    }
  };

  const selectPhoto = (): string => {
    return getPhotoAsset(profile?.photo ?? "") || defaultPhoto;
  };

  // Mostrar hasta 3 juegos en común
  const displayGames = profile?.games?.slice(0, 3) || [];

  return (
    <div className="its-match-container">
      {/* Partículas de fondo */}
      <div className="its-match-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="particle" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>

      {/* Tarjeta principal */}
      <div onClick={handleClick} className="its-match-card">
        {/* Efecto de brillo superior */}
        <div className="its-match-glow-top" />

        {/* Foto de perfil con anillo animado */}
        <div className="its-match-avatar-container">
          <div className="its-match-avatar-ring" />
          <img src={selectPhoto()} alt="Profile avatar" className="its-match-profile-pic" />
        </div>

        {/* Nombre del match */}
        <h2 className="its-match-nickname">{profile?.nick_name || "Player"}</h2>

        {/* Info del perfil */}
        <div className="its-match-info">
          {profile?.age && (
            <span className="its-match-badge">
              <i className="fa-solid fa-cake-candles" /> {profile.age}
            </span>
          )}
          {profile?.location && (
            <span className="its-match-badge">
              <i className="fa-solid fa-location-dot" /> {profile.location}
            </span>
          )}
        </div>

        {/* Juegos en común */}
        {displayGames.length > 0 && (
          <div className="its-match-games">
            <span className="its-match-games-label">Games in common</span>
            <div className="its-match-games-list">
              {displayGames.map((game, index) => (
                <span key={index} className="its-match-game-tag">
                  {game.gameTitle}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botón CTA */}
        <button className="its-match-cta">
          <i className="fa-solid fa-user" /> View Profile
          <span className="its-match-cta-glow" />
        </button>
      </div>
    </div>
  );
};
