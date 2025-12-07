/**
 * Helper functions for loading and validating game images
 */

/**
 * Validates if a game image URL is valid
 */
export const isValidGameImage = (imageUrl: string | null | undefined): boolean => {
  if (!imageUrl) return false;
  if (typeof imageUrl !== "string") return false;
  if (imageUrl.trim() === "") return false;
  if (imageUrl === "undefined") return false;
  if (imageUrl === "null") return false;

  // Check if it's a valid URL
  try {
    const url = new URL(imageUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Fetches game image from RAWG API
 */
export const fetchGameImageFromRAWG = async (
  gameTitle: string,
  rawgApiKey: string | null
): Promise<string | null> => {
  if (!rawgApiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${rawgApiKey}&search=${encodeURIComponent(gameTitle)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Rate limit reached while searching for game image:", gameTitle);
        return null;
      }
      if (response.status === 401 || response.status === 403) {
        console.error("RAWG API key is invalid or expired");
        return null;
      }
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const game = data.results[0];
    return game.background_image || null;
  } catch (error) {
    console.error("Error fetching game image from RAWG:", error);
    return null;
  }
};

/**
 * Gets a valid game image URL, trying to fetch from RAWG if needed
 */
export const getGameImageUrl = async (
  gameTitle: string,
  currentImage: string | null | undefined,
  rawgApiKey: string | null
): Promise<string | null> => {
  // If current image is valid, return it
  if (isValidGameImage(currentImage)) {
    return currentImage!;
  }

  // Try to fetch from RAWG
  if (rawgApiKey) {
    const fetchedImage = await fetchGameImageFromRAWG(gameTitle, rawgApiKey);
    if (fetchedImage) {
      return fetchedImage;
    }
  }

  return null;
};
