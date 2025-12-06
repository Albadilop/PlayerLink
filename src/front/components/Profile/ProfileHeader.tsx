import React from 'react';
import { selectPhoto, selectMedal } from '../../utils/profileHelpers';
import type { Game } from '../../types';
import './ProfileHeader.css';

export interface ProfileHeaderProps {
  photo: string;
  nickName: string;
  location: string;
  topThreeGames: Game[];
  onPhotoEdit: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  photo,
  nickName,
  location,
  topThreeGames,
  onPhotoEdit,
}) => {
  return (
    <div className="left-panel">
      <div className="avatar-section">
        <button className="gear-btn" onClick={onPhotoEdit}>
          <i className="fa-solid fa-gear"></i>
        </button>
        <img src={selectPhoto(photo)} alt="Avatar" className="profile-avatar" />
      </div>
      <h2>{nickName}</h2>
      <p className="location">{location}</p>
      <div className="medal-list">
        {topThreeGames.map((game, i) => (
          <div key={game.id || i} className="medal-game-card">
            <img
              src={selectMedal(game.gameHoursPlayed)}
              alt="Medal"
              className="medal-icon"
              role="button"
              data-bs-toggle="popover"
              data-bs-trigger="hover focus"
              data-bs-container="body"
              data-bs-placement="bottom"
              data-bs-content={`${game.gameTitle} — ${game.gameHoursPlayed} horas`}
            />
            <img
              className="img-fluid gameImg"
              src={game.gameImage}
              alt={`Portada de ${game.gameTitle}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

