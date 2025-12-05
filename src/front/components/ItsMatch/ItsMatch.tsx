import './ItsMatch.css';
import { useNavigate } from 'react-router-dom';
import { getPhotoAsset, defaultPhoto } from "../../constants/photoAssets";
import photo7 from "../../assets/img/profile-pics/profile-pic-7.png";
import photo8 from "../../assets/img/profile-pics/profile-pic-8.png";
import photo9 from "../../assets/img/profile-pics/profile-pic-9.png";
import type { Profile } from '../../types';

interface ItsMatchProps {
  profile: Profile;
  photo?: string;
}

export const ItsMatch: React.FC<ItsMatchProps> = ({ profile, photo }) => {
  const navigate = useNavigate();

  //Prevención de error si el perfil no existe
  if (!profile) return null;

  const handleClick = () => {
    navigate('/private/your-matches/');
  };

  const selectPhoto = (): string => {
    return getPhotoAsset(profile?.photo) || defaultPhoto;
  };

  return (
    <>
      <div className='d-flex justify-content-center'>
        <div className="col">
          <div onClick={handleClick} className="card its-match-card pulsate-bck">
            <div className="d-flex align-items-start">
              <div className="card-body d-flex flex-column flex-md-row align-items-center">
              </div>
              <div className='rounded-circle mb-3 mb-md-0'>
                <img src={selectPhoto()} alt="Profile avatar" className='its-match-profile-pic border border-4 my-2'></img>
              </div>
              <div className="d-flex align-items-start">
                <div className="text-center text-md-start ms-md-4 mt-2 me-3">
                  <h1>{profile?.nick_name || 'undefined'}</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h4 className='d-flex justify-content-center text-center mt-3 its-match-card-font'>
        Click on the card to know more about your match
      </h4>
    </>
  );
};

