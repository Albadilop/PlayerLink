import React, { useRef } from "react";
import { PHOTO_MAP } from "../../constants";
import "./PhotoSelector.css";

export interface PhotoSelectorProps {
  isOpen: boolean;
  currentPhoto: string;
  onSelect: (fileName: string) => void;
  onUpload?: (file: File) => void;
  onClose: () => void;
}

export const PhotoSelector: React.FC<PhotoSelectorProps> = ({
  isOpen,
  currentPhoto,
  onSelect,
  onUpload,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      // Validar tipo de archivo
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        alert(
          "Tipo de archivo no válido. Por favor, selecciona una imagen (PNG, JPG, GIF o WEBP)."
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert("El archivo es demasiado grande. Por favor, selecciona una imagen menor a 5MB.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Validar dimensiones de la imagen
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxWidth = 2000;
        const maxHeight = 2000;

        if (img.width > maxWidth || img.height > maxHeight) {
          alert(
            `Las dimensiones de la imagen son demasiado grandes. Máximo: ${maxWidth}x${maxHeight} píxeles. Tu imagen: ${img.width}x${img.height} píxeles.`
          );
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }

        // Si pasa todas las validaciones, proceder con la subida
        onUpload(file);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        alert(
          "El archivo seleccionado no es una imagen válida. Por favor, selecciona una imagen válida."
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      img.src = objectUrl;
      return; // No resetear aquí, se resetea en los callbacks
    }
    // Resetear el input para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const currentPhotoKey = Object.entries(picMap).find(([, key]) => key === currentPhoto)?.[0];

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
              className={file === currentPhotoKey ? "selected" : ""}
              onClick={() => handlePhotoClick(file)}
            />
          ))}
        </div>
        {onUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button onClick={handleUploadClick} className="upload-btn">
              <i className="fa-solid fa-upload" /> Upload photo
            </button>
          </>
        )}
        <button onClick={onClose} className="cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  );
};
