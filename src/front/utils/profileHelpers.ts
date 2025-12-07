import { medalAssets } from "../constants/medalAssets";
import { getPhotoAsset, defaultPhoto } from "../constants/photoAssets";

/**
 * Selecciona la medalla apropiada basada en las horas de juego
 * @param hours - Horas de juego (número o string)
 * @returns Ruta a la imagen de la medalla
 */
export const selectMedal = (hours: number | string): string => {
  const h = typeof hours === "string" ? parseInt(hours, 10) : hours;
  if (isNaN(h) || h === 0) {
    return medalAssets.bronze;
  }
  if (h >= 2500) {
    return medalAssets.gold;
  }
  if (h >= 500) {
    return medalAssets.silver;
  }
  return medalAssets.bronze;
};

/**
 * Selecciona la foto de perfil apropiada
 * @param photoKey - Clave de la foto en el perfil
 * @returns Ruta a la imagen de la foto
 */
export const selectPhoto = (photoKey: string | null | undefined): string => {
  if (!photoKey) {
    return defaultPhoto;
  }

  // Si es una foto subida (empieza con "uploaded_"), construir la URL del endpoint
  if (photoKey.startsWith("uploaded_")) {
    const filename = photoKey.replace("uploaded_", "");
    const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
    return `${BASE_URL.replace(/\/+$/, "")}/api/profiles/photo/${filename}`;
  }

  return getPhotoAsset(photoKey) || defaultPhoto;
};

/**
 * Calcula el total de horas jugadas en todos los juegos
 * @param games - Array de juegos
 * @returns Total de horas jugadas
 */
export const calculateTotalHours = (games: Array<{ gameHoursPlayed?: number | null }>): number => {
  return games.reduce((total, game) => {
    const hours = game.gameHoursPlayed || 0;
    return total + (typeof hours === "number" ? hours : parseInt(String(hours), 10) || 0);
  }, 0);
};

/**
 * Formatea las horas con singular/plural correcto
 * @param hours - Número de horas
 * @returns String formateado (ej: "1 hour" o "5 hours")
 */
export const formatHours = (hours: number | string | null | undefined): string => {
  const h = typeof hours === "string" ? parseInt(hours, 10) : hours || 0;
  if (isNaN(h)) return "0 hours";
  return h === 1 ? "1 hour" : `${h} hours`;
};

/**
 * Obtiene los top N juegos ordenados por horas jugadas
 * @param games - Array de juegos
 * @param topN - Número de juegos a retornar (default: 3)
 * @returns Array de los top N juegos
 */
export const getTopGames = <T extends { gameHoursPlayed?: number | null }>(
  games: T[],
  topN: number = 3
): T[] => {
  return games
    .slice()
    .sort((a, b) => {
      const hoursA = a.gameHoursPlayed || 0;
      const hoursB = b.gameHoursPlayed || 0;
      const numA = typeof hoursA === "number" ? hoursA : parseInt(String(hoursA), 10) || 0;
      const numB = typeof hoursB === "number" ? hoursB : parseInt(String(hoursB), 10) || 0;
      return numB - numA;
    })
    .slice(0, topN);
};
