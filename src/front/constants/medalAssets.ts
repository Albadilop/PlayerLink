/**
 * Medal assets for game achievements
 */
import goldMedal from "../assets/img/medals/gold-medal.png";
import silverMedal from "../assets/img/medals/silver-medal.png";
import bronzeMedal from "../assets/img/medals/bronze-medal.png";

export const medalAssets = {
  gold: goldMedal,
  silver: silverMedal,
  bronze: bronzeMedal,
};

export type MedalType = "gold" | "silver" | "bronze";

export const getMedalAsset = (type: MedalType): string => {
  return medalAssets[type];
};
