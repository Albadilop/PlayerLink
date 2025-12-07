/**
 * Photo assets mapping for profile pictures
 */
import photo1 from "../assets/img/profile-pics/profile-pic-1.png";
import photo2 from "../assets/img/profile-pics/profile-pic-2.png";
import photo3 from "../assets/img/profile-pics/profile-pic-3.png";
import photo4 from "../assets/img/profile-pics/profile-pic-4.png";
import photo5 from "../assets/img/profile-pics/profile-pic-5.png";
import photo6 from "../assets/img/profile-pics/profile-pic-6.png";
import photo7 from "../assets/img/profile-pics/profile-pic-7.png";
import photo8 from "../assets/img/profile-pics/profile-pic-8.png";
import photo9 from "../assets/img/profile-pics/profile-pic-9.png";

export const photoAssets: Record<string, string> = {
  photo1,
  photo2,
  photo3,
  photo4,
  photo5,
  photo6,
  photo7,
  photo8,
  photo9,
};

export const getPhotoAsset = (photoKey: string): string => {
  return photoAssets[photoKey] || photo1;
};

export { photo1 as defaultPhoto };
