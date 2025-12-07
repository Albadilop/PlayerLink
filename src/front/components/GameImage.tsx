import React, { useState, useEffect } from "react";
import { isValidGameImage, fetchGameImageFromRAWG } from "../utils/gameImageHelper";
import "./GameImage.css";

interface GameImageProps {
  gameTitle: string;
  gameImage: string | null | undefined;
  className?: string;
  alt?: string;
  rawgApiKey?: string | null;
}

export const GameImage: React.FC<GameImageProps> = ({
  gameTitle,
  gameImage,
  className = "",
  alt,
  rawgApiKey = null,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    // Reset states when game changes
    setIsLoading(true);
    setHasError(false);
    setIsFetching(false);

    // Check if current image is valid
    if (isValidGameImage(gameImage)) {
      setImageUrl(gameImage!);
      setIsLoading(false);
      return;
    }

    // If image is invalid and we have RAWG API key, try to fetch it
    if (rawgApiKey && gameTitle) {
      setIsFetching(true);
      fetchGameImageFromRAWG(gameTitle, rawgApiKey)
        .then((fetchedImage) => {
          if (fetchedImage) {
            setImageUrl(fetchedImage);
            setHasError(false);
          } else {
            setImageUrl(null);
            setHasError(true);
          }
        })
        .catch(() => {
          setImageUrl(null);
          setHasError(true);
        })
        .finally(() => {
          setIsLoading(false);
          setIsFetching(false);
        });
    } else {
      // No API key or no title, just show error
      setImageUrl(null);
      setHasError(true);
      setIsLoading(false);
    }
  }, [gameTitle, gameImage, rawgApiKey]);

  const handleImageError = () => {
    // If the image fails to load and we haven't tried fetching yet, try now
    if (!isFetching && rawgApiKey && gameTitle && !isValidGameImage(gameImage)) {
      setIsFetching(true);
      fetchGameImageFromRAWG(gameTitle, rawgApiKey)
        .then((fetchedImage) => {
          if (fetchedImage) {
            setImageUrl(fetchedImage);
            setHasError(false);
          } else {
            setHasError(true);
          }
        })
        .catch(() => {
          setHasError(true);
        })
        .finally(() => {
          setIsFetching(false);
        });
    } else {
      setHasError(true);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className={`game-image-placeholder ${className}`}>
        <i className="fa-solid fa-spinner fa-spin"></i>
      </div>
    );
  }

  if (hasError || !imageUrl) {
    return (
      <div className={`game-image-placeholder ${className}`}>
        <i className="fa-solid fa-gamepad"></i>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt || gameTitle}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
};
