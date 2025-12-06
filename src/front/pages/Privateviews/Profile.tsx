// Profile.tsx
// Componente de perfil de usuario con edición, selección de avatar, medallas de juego y sección de comentarios

import React, { useEffect, useRef, useState } from "react";
import "../../pages/Privateviews/Profile.css";

// Hooks y servicios
import useGlobalReducer from "../../hooks/useGlobalReducer";
import userServices from "../../services/userServices";
import reviewServices from "../../services/reviewServices";
import gameServices from "../../services/gameServices";
import apiClient from "../../services/apiClient";
import { normalizeUrl } from "../../utils/urlHelper";
import { formatPreferences, parsePreferences } from "../../utils/formatters";

// Constants and assets
import { DEFAULT_VALUES, GENDER_OPTIONS, PHOTO_MAP } from "../../constants";

// Components
import {
  PhotoSelector,
  ProfileHeader,
  ProfileTabs,
  ProfileInfoTab,
  ProfileGamesTab,
  ProfileReviewsTab,
  GameFormData,
} from "../../components/Profile";

// Preferences and Languages Modals
import { GamingPreferencesModal } from "../../components/ProfileModals/GamingPreferencesModal";
import { LanguageModal } from "../../components/ProfileModals/LanguageModal";
import { useNavigate } from "react-router-dom";
import type { Game } from "../../types";

declare global {
  interface Window {
    bootstrap: typeof import('bootstrap');
  }
}

interface ProfileState {
  name: string;
  nick_name: string;
  age: number;
  gender: string;
  location: string;
  zodiac: string;
  discord: string;
  steam_id: string;
  languages: string;
  preferences: string;
  bio: string;
  photo: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const Profile: React.FC = () => {
  // Acceso al store global y dispatch para actualizar datos
  const navigate = useNavigate();
  const [availableGames, setAvailableGames] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { store, dispatch } = useGlobalReducer();
  const url = import.meta.env.VITE_BACKEND_URL;
  const rawgApi = import.meta.env.VITE_RAWG_KEY;
  const gameOptions: SelectOption[] = availableGames.map(name => ({ value: name, label: name }));

  // Estados locales
  const [activeTab, setActiveTab] = useState<string>("info");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [notice, setNotice] = useState<React.ReactNode>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [profile, setProfile] = useState<ProfileState>({
    name: " ",
    nick_name: "",
    age: 0,
    gender: DEFAULT_VALUES.GENDER_UNDEFINED,
    location: " ",
    zodiac: " ",
    discord: " ",
    steam_id: " ",
    languages: " ",
    preferences: " ",
    bio: " ",
    photo: DEFAULT_VALUES.PROFILE_PHOTO
  });
  const clearNoticeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estados de Modales languages y Gaming preferences
  const [showGamingPreferencesModal, setShowGamingPreferencesModal] = useState<boolean>(false);
  const [selectedGamingPreferences, setSelectedGamingPreferences] = useState<string[]>(
    parsePreferences(profile.preferences)
  );
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    parsePreferences(profile.languages)
  );

  const allGames: Game[] = store.user?.profile?.games ? store.user.profile.games : [];
  const topThreeGames = allGames
    .slice()
    .sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0))
    .slice(0, 3);

  // Mapeo avatars: filename -> clave interna
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

  // Carga inicial de perfil y reviews recibidos
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userFromStorage = localStorage.getItem('user');
    
    if (!token) {
      navigate('/');
      return;
    }
    
    if (!store.user && userFromStorage) {
      try {
        const userObj = JSON.parse(userFromStorage);
        dispatch({ type: 'getUserInfo', payload: userObj });
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        loadProfile();
      }
    }
    
    if (store.user) {
      loadProfile();
    }
    
    return () => {
      if (clearNoticeTimerRef.current) {
        clearTimeout(clearNoticeTimerRef.current);
      }
    };
  }, [navigate, store.user, dispatch]);

  useEffect(() => {
    // Limpiar popovers anteriores
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
      if (window.bootstrap?.Popover) {
        const popover = window.bootstrap.Popover.getInstance(el);
        if (popover) popover.dispose();
      }
    });

    // Inicializar popovers actuales
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
      if (window.bootstrap?.Popover) {
        new window.bootstrap.Popover(el);
      }
    });
  }, [topThreeGames]);

  useEffect(() => {
    if (activeTab === "Games" && availableGames.length < 1) {
      fetchGames();
    }
    if (activeTab === "comments") {
      getReviews();
    }
  }, [activeTab]);

  const getReviews = async () => {
    if (!store.user?.id) return;
    reviewServices.getAllReviewsReceived(store.user.id)
      .then(data => {
        if (!(data instanceof Error)) {
          dispatch({ type: "matchReviewsReceived", payload: data });
        }
      });
  };

  const fetchGames = async () => {
    try {
      const pageSize = 40;
      const pages = 25;
      let allGames: string[] = [];

      for (let page = 1; page <= pages; page++) {
        const resp = await fetch(
          `https://api.rawg.io/api/games?key=${rawgApi}&page_size=${pageSize}&page=${page}`
        );
        if (!resp.ok) throw new Error('Error cargando juegos');
        const data = await resp.json();
        allGames = allGames.concat(data.results.map((g: { name: string }) => g.name));
      }
      setAvailableGames(allGames);
    } catch (err) {
      console.error('RAWG fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await userServices.getUserInfo();
      
      if (data instanceof Error) {
        console.error('Error loading profile:', data);
        if (!store.user) {
          navigate('/');
        }
        return;
      }

      if (!data || !data.user) {
        console.error('No user data received');
        if (!store.user) {
          navigate('/');
        }
        return;
      }

      await dispatch({ type: 'getUserInfo', payload: data.user });

      const profileData = data.user?.profile;
      if (!profileData) return;

      setProfile({
        name: profileData.name || " ",
        nick_name: profileData.nick_name || "",
        age: profileData.age || 0,
        gender: profileData.gender || DEFAULT_VALUES.GENDER_UNDEFINED,
        location: profileData.location || " ",
        zodiac: profileData.zodiac || " ",
        discord: profileData.discord || " ",
        steam_id: profileData.steam || " ",
        languages: profileData.language || " ",
        preferences: profileData.preferences || " ",
        bio: profileData.bio || " ",
        photo: profileData.photo || DEFAULT_VALUES.PROFILE_PHOTO,
      });

      setSelectedGamingPreferences(parsePreferences(profileData.preferences));
      setSelectedLanguages(parsePreferences(profileData.language));

      const isIncomplete =
        !profileData.name || profileData.name.length < 2 ||
        !profileData.nick_name || profileData.nick_name.length < 2 ||
        !profileData.age || profileData.age <= 0 ||
        !profileData.gender || profileData.gender.length < 2 ||
        !profileData.location || profileData.location.length < 2 ||
        !profileData.zodiac || profileData.zodiac.length < 2 ||
        !profileData.discord || profileData.discord.length < 2 ||
        !profileData.steam || profileData.steam.length < 2 ||
        !profileData.language || profileData.language.length < 2 ||
        !profileData.preferences || profileData.preferences.length < 2 ||
        !profileData.bio || profileData.bio.length < 2 ||
        !profileData.photo || profileData.photo.length < 2;

      if (isIncomplete) {
        setNotice(
          <h4 className="text-center text-danger">
            <i className="fa-solid fa-triangle-exclamation text-warning fa-xl"></i> Profile incomplete. Remember to complete it to unlock the full potential of PlayerLink.
          </h4>
        );
        clearNoticeTimerRef.current = setTimeout(() => setNotice(""), 10000);
      }
    } catch (error) {
      console.error('Error en loadProfile:', error);
    }
  };

  const handlePicChange = async (fileName: string) => {
    if (!store.user?.id) {
      console.error('User not available');
      return;
    }
    const newKey = picMap[fileName] || DEFAULT_VALUES.PROFILE_PHOTO;
    try {
      await userServices.changeUserPhoto(store.user.id, { photo: newKey });
      setProfile(prev => ({ ...prev, photo: newKey }));
    } catch (err) {
      console.error('Error al cambiar foto:', err);
    } finally {
      setShowModal(false);
    }
  };

  const updateProfile = async () => {
    if (!store.user || !store.user.id) {
      console.error('User not available');
      return;
    }

    if (isEditing) {
      if (store.user.profile) {
        try {
          const response = await apiClient.put(
            `/api/profiles/${store.user.id}`,
            profile,
            true
          );
          if (!response.ok) throw new Error('Error al guardar perfil');
          await userServices.getUserInfo(0, true);
          await loadProfile();
        } catch (err) {
          console.error('Error en updateProfile:', err);
        }
      } else {
        try {
          const response = await apiClient.post(
            `/api/profiles/${store.user.id}`,
            profile,
            true
          );
          if (!response.ok) throw new Error('Error al guardar perfil');
          await userServices.getUserInfo(0, true);
          await loadProfile();
        } catch (err) {
          console.error('Error en updateProfile:', err);
        }
      }
    }

    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: keyof ProfileState, value: string | number) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const selectGameImage = async (gameTitle: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://api.rawg.io/api/games?key=${rawgApi}&search=${gameTitle}`);
      const data = await response.json();

      if (data.results.length === 0) {
        console.warn("No se encontraron resultados para:", gameTitle);
        return null;
      }

      const game = data.results[0];
      return game.background_image;
    } catch (error) {
      console.error("Error al obtener la imagen del juego:", error);
      return null;
    }
  };

  const handleAddGame = async (gameData: GameFormData) => {
    if (!store.user?.profile?.id) {
      console.error('User profile not available');
      return;
    }

    const image = await selectGameImage(gameData.title);
    const newGame = {
      ...gameData,
      image: image || ''
    };
    await gameServices.postNewGame(store.user.profile.id, newGame);
    await loadProfile();
  };

  const handleDeleteGame = async (game_id: number) => {
    await gameServices.deleteGameById(game_id);
    await loadProfile();
  };

  const handleUpdateGame = async (game_id: number, hours: number) => {
    await gameServices.updateGameInfo(game_id, hours);
    await loadProfile();
  };

  const reviews = store.matchReviewsReceived?.reviews_received || [];

  return (
    <>
      {notice && <div className="alert alert-danger">{notice}</div>}
      <div className="profile-container">
        <ProfileHeader
          photo={profile.photo}
          nickName={profile.nick_name}
          location={profile.location}
          topThreeGames={topThreeGames}
          onPhotoEdit={() => setShowModal(true)}
        />

        <div className="right-panel">
          <div className="bio-box">
            <h3>Bio</h3>
            {isEditing ? (
              <textarea
                className="form-control textareastyle"
                rows={3}
                value={profile.bio}
                onChange={e => handleInputChange('bio', e.target.value)}
              />
            ) : (
              <p>{profile.bio}</p>
            )}
          </div>

          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'info' && (
            <ProfileInfoTab
              profile={profile}
              isEditing={isEditing}
              selectedGamingPreferences={selectedGamingPreferences}
              selectedLanguages={selectedLanguages}
              showGamingPreferencesModal={showGamingPreferencesModal}
              showLanguageModal={showLanguageModal}
              onInputChange={handleInputChange}
              onGamingPreferencesChange={setSelectedGamingPreferences}
              onLanguagesChange={setSelectedLanguages}
              onShowGamingPreferencesModal={setShowGamingPreferencesModal}
              onShowLanguageModal={setShowLanguageModal}
              onSave={updateProfile}
            />
          )}

          {activeTab === 'Games' && (
            <ProfileGamesTab
              games={allGames}
              availableGames={availableGames}
              gameOptions={gameOptions}
              loading={loading}
              onAddGame={handleAddGame}
              onDeleteGame={handleDeleteGame}
              onUpdateGame={handleUpdateGame}
            />
          )}

          {activeTab === 'comments' && (
            <ProfileReviewsTab reviews={reviews} />
          )}
        </div>

        <PhotoSelector
          isOpen={showModal}
          currentPhoto={profile.photo}
          onSelect={handlePicChange}
          onClose={() => setShowModal(false)}
        />
      </div>
    </>
  );
};

export default Profile;
