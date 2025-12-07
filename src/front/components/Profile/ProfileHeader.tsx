import React, { useEffect, useRef } from "react";
import { selectPhoto, selectMedal } from "../../utils/profileHelpers";
import type { Game } from "../../types";
import "./ProfileHeader.css";

export interface ProfileHeaderProps {
  photo: string;
  nickName: string;
  location: string;
  bio: string;
  topThreeGames: Game[];
  onPhotoEdit: () => void;
  isEditing?: boolean;
  onBioChange?: (value: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  photo,
  nickName,
  location,
  bio,
  topThreeGames,
  onPhotoEdit,
  isEditing = false,
  onBioChange,
}) => {
  const bioTextRef = useRef<HTMLParagraphElement>(null);
  const bioContainerRef = useRef<HTMLDivElement>(null);

  // Resetear tamaño de fuente cuando cambia la bio
  useEffect(() => {
    if (!isEditing && bioTextRef.current) {
      bioTextRef.current.style.fontSize = "0.9rem";
    }
  }, [bio, isEditing]);

  return (
    <div className="profile-header">
      {/* Avatar Section */}
      <div className="profile-avatar-section">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-ring" />
          <img src={selectPhoto(photo)} alt="Avatar" className="profile-avatar-img" />
          <button className="profile-edit-btn" onClick={onPhotoEdit} aria-label="Edit photo">
            <i className="fa-solid fa-camera" />
          </button>
        </div>
      </div>

      {/* User Info */}
      <h2 className="profile-nickname">{nickName || "Player"}</h2>
      <p className="profile-location">
        <i className="fa-solid fa-location-dot" />
        {location || "Unknown location"}
      </p>

      {/* Bio */}
      <div className="profile-bio" ref={bioContainerRef}>
        {isEditing ? (
          <textarea
            className="profile-bio-textarea"
            rows={3}
            value={bio}
            onChange={(e) => onBioChange?.(e.target.value)}
            placeholder="Write something about yourself..."
          />
        ) : (
          <p ref={bioTextRef}>{bio || "No bio yet"}</p>
        )}
      </div>

      {/* Top Games */}
      {topThreeGames.length > 0 && (
        <div className="profile-top-games">
          <span className="profile-top-games-label">
            <i className="fa-solid fa-trophy" /> Top Games
          </span>
          <div className="profile-games-list">
            {topThreeGames.map((game, i) => (
              <div key={game.id || i} className="profile-game-card">
                <img src={game.gameImage} alt={game.gameTitle} className="profile-game-img" />
                <div className="profile-game-info">
                  <span className="profile-game-title">{game.gameTitle}</span>
                </div>
                <img
                  src={selectMedal(game.gameHoursPlayed)}
                  alt="Medal"
                  className="profile-medal"
                  role="button"
                  data-bs-toggle="popover"
                  data-bs-trigger="hover focus"
                  data-bs-container="body"
                  data-bs-placement="bottom"
                  data-bs-content={`${game.gameTitle} — ${game.gameHoursPlayed}h`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
