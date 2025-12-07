import React from 'react';
import { DEFAULT_VALUES, PHOTO_MAP } from '../../constants';
import './PhotoSelector.css';

export interface PhotoSelectorProps {
  isOpen: boolean;
  currentPhoto: string;
  onSelect: (fileName: string) => void;
  onClose: () => void;
}

export const PhotoSelector: React.FC<PhotoSelectorProps> = ({
  isOpen,
  currentPhoto,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  const picMap: Record<string, string> = {
    ...PHOTO_MAP,
    "profile-pic-2.png": "photo2",
    "profile-pic-3.png": "photo3",
    "profile-pic-4.png": "photo4",
    "profile-pic-5.png": "photo5",
    "profile-pic-6.png": "photo6",
    "profile-pic-7.png": "photo7",
    "profile-pic-8.png": "photo8",
    "profile-pic-9.png": "photo9",
  };

  const handlePhotoClick = (fileName: string) => {
    onSelect(fileName);
  };

  const currentPhotoKey = Object.entries(picMap).find(
    ([, key]) => key === currentPhoto
  )?.[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Choose Your Avatar</h3>
        <div className="avatar-grid">
          {Object.keys(picMap).map((file, idx) => (
            <img
              key={idx}
              src={`/src/front/assets/img/profile-pics/${file}`}
              alt={file}
              className={file === currentPhotoKey ? 'selected' : ''}
              onClick={() => handlePhotoClick(file)}
            />
          ))}
        </div>
        <button onClick={onClose} className="cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  );
};

