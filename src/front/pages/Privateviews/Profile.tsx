// Profile.tsx
// Componente de perfil de usuario con edición, selección de avatar, medallas de juego y sección de comentarios

import React, { useEffect, useRef, useState } from "react";
import "../../pages/Privateviews/Profile.css";
import Select from 'react-select';

// Hooks y servicios
import useGlobalReducer from "../../hooks/useGlobalReducer";
import userServices from "../../services/userServices";
import reviewServices from "../../services/reviewServices";
import gameServices from "../../services/gameServices";
import { normalizeUrl } from "../../utils/urlHelper";

// Constants and assets
import { DEFAULT_VALUES, GENDER_OPTIONS, PHOTO_MAP, ROUTES } from "../../constants";
import { photoAssets, getPhotoAsset, defaultPhoto } from "../../constants/photoAssets";
import { medalAssets } from "../../constants/medalAssets";

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

interface GameForm {
  title: string;
  hours_played: number | string;
  image: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// Funciones auxiliares para formatear preferencias
const formatPreferences = (prefs: string[]): string => {
  if (!prefs || prefs.length === 0) return '';
  if (prefs.length === 1) return prefs[0] + '.';
  return prefs.slice(0, -1).join(', ') + ' and ' + prefs[prefs.length - 1] + '.';
};

const parsePreferences = (str: string | null | undefined): string[] => {
  if (!str) return [];
  return str
    .replace(/\.$/, '')                // quitar punto final
    .split(/, | and /)                 // dividir por ", " y " and "
    .map(p => p.trim())               // quitar espacios
    .filter(Boolean);                 // quitar vacíos
};

const Profile: React.FC = () => {
  // Acceso al store global y dispatch para actualizar datos
  const navigate = useNavigate();
  const [availableGames, setAvailableGames] = useState<string[]>([]);
  const [game, setGame] = useState<GameForm>({ title: '', hours_played: '', image: '' });
  const [loading, setLoading] = useState<boolean>(true);
  const { store, dispatch } = useGlobalReducer();
  const url = import.meta.env.VITE_BACKEND_URL;
  const rawgApi = import.meta.env.VITE_RAWG_KEY;
  const gameOptions: SelectOption[] = availableGames.map(name => ({ value: name, label: name }));
  const [idOfGameBeingEdited, setIdOfGameBeingEdited] = useState<number>(0);

  // Estados locales
  const [activeTab, setActiveTab] = useState<string>("info");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [changer, setChanger] = useState<boolean>(false);
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

  // Estados para los errores de juego repetido y horas
  const [errorRepeatedGame, setErrorRepeatedGame] = useState<string>("");
  const [errorHoursPlayed, setErrorHoursPlayed] = useState<string>("");
  const [errorCeroHours, setErrorCeroHours] = useState<string>("");

  // Opciones para selects
  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const genders = [...GENDER_OPTIONS];

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
  // photoAssets is now imported from constants

  // Carga inicial de perfil y reviews recibidos
  useEffect(() => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem('token');
    const userFromStorage = localStorage.getItem('user');
    
    // Si no hay token, redirigir al login
    if (!token) {
      navigate('/');
      return;
    }
    
    // Si hay token pero no hay usuario en el store, intentar cargarlo desde localStorage
    if (!store.user && userFromStorage) {
      try {
        const userObj = JSON.parse(userFromStorage);
        dispatch({ type: 'getUserInfo', payload: userObj });
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        // Si no se puede parsear, intentar cargar desde el servidor
        loadProfile();
      }
    }
    
    // Si hay usuario en el store, cargar el perfil
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
    // Limpiar popovers anteriores (evita duplicados o errores)
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
      .then(data => dispatch({ type: "matchReviewsReceived", payload: data }));
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
      console.log(allGames);
    } catch (err) {
      console.error('RAWG fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await userServices.getUserInfo();
      
      // Verificar que la respuesta no sea un Error
      if (data instanceof Error) {
        console.error('Error loading profile:', data);
        // Si hay un error pero el usuario ya está en el store, no expulsarlo
        if (!store.user) {
          navigate('/');
        }
        return;
      }

      // Verificar que data.user existe
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

  // Cambiar avatar en backend y estado local
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

  // Seleccionar asset de avatar
  const selectPhoto = (): string => getPhotoAsset(profile.photo) || defaultPhoto;

  // Seleccionar medalla según horas
  const selectMedal = (hours: number | string): string => {
    const h = typeof hours === 'string' ? parseInt(hours, 10) : hours;
    if (isNaN(h) || h === 0) return medalAssets.bronze;
    if (h >= 2500) return medalAssets.gold;
    if (h >= 500) return medalAssets.silver;
    return medalAssets.bronze;
  };

  // Crear o actualizar perfil
  const updateProfile = async () => {
    if (!store.user || !store.user.id) {
      console.error('User not available');
      return;
    }

    if (isEditing) {
      if (store.user.profile) {
        try {
          const resp = await fetch(normalizeUrl(url, `/api/profiles/${store.user.id}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(profile),
          });
          if (!resp.ok) throw new Error('Error al guardar perfil');
          // Forzar refresh después de actualizar el perfil
          await userServices.getUserInfo(0, true);
          await loadProfile();
        } catch (err) {
          console.error('Error en updateProfile:', err);
        }
      } else {
        try {
          const resp = await fetch(normalizeUrl(url, `/api/profiles/${store.user.id}`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(profile),
          });
          if (!resp.ok) throw new Error('Error al guardar perfil');
          // Forzar refresh después de crear el perfil
          await userServices.getUserInfo(0, true);
          await loadProfile();
        } catch (err) {
          console.error('Error en updateProfile:', err);
        }
      }
    }

    setIsEditing(!isEditing);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string | number } }) => {
    const { name, value } = e.target;
    setGame((prev) => ({
      ...prev,
      [name]: name === "hours_played" ? Number(value) : value,
    }));
  };

  // Manejar cambios en inputs
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
      console.log("Nombre:", game.name);
      console.log("Portada:", game.background_image);
      return game.background_image;
    } catch (error) {
      console.error("Error al obtener la imagen del juego:", error);
      return null;
    }
  };

  const handleAdd = async () => {
    if (!store.user?.profile?.id) {
      console.error('User profile not available');
      return;
    }

    setErrorRepeatedGame('');
    setErrorHoursPlayed('');

    if (!game.title || game.title.length <= 0 || !game.hours_played || Number(game.hours_played) <= 0) {
      setErrorHoursPlayed('Your must complete all the information');
      return;
    }
    if (store.user?.profile?.games?.some(g => g.gameTitle === game.title)) {
      setErrorRepeatedGame('This game is already on the list');
      return;
    }
    try {
      const image = await selectGameImage(game.title);
      console.log("La imagen es:", image);

      const newGame = {
        ...game,
        image: image || ''
      };
      console.log("Enviando:", newGame);
      await gameServices.postNewGame(store.user.profile.id, newGame);
      await loadProfile();

      // Cerrar modal y limpiar
      const modalEl = document.getElementById('commentModal');
      if (modalEl && window.bootstrap?.Modal) {
        const modal = window.bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
      setGame({ title: '', hours_played: '', image: '' });
    } catch (err) {
      console.error('Error añadiendo el juego o recargando perfil:', err);
    }
  };

  const handleDeleteGame = async (game_id: number) => {
    await gameServices.deleteGameById(game_id);
    await loadProfile();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, gameId: number) => {
    e.preventDefault();
    const hours = Number(game.hours_played);

    if (hours <= 0) {
      setErrorCeroHours('Hours must be more than 0');
      return;
    }
    await gameServices.updateGameInfo(gameId, hours);
    await loadProfile();
    setIdOfGameBeingEdited(0);
    setGame({
      hours_played: 0,
      title: '',
      image: ''
    });
    setErrorCeroHours("");
  };

  return (
    <>
      {notice && <div className="alert alert-danger">{notice}</div>}
      <div className="profile-container">
        {/* PANEL IZQUIERDO: Avatar y Medallas */}
        <div className="left-panel">
          <div className="avatar-section">
            <button className="gear-btn" onClick={() => setShowModal(true)}>
              <i className="fa-solid fa-gear"></i>
            </button>
            <img src={selectPhoto()} alt="Avatar" className="profile-avatar" />
          </div>
          <h2>{profile.nick_name}</h2>
          <p className="location">{profile.location}</p>
          <div className="medal-list">
            {topThreeGames.map((el, i) => (
              <div key={el.id || i} className="medal-game-card">
                <img
                  src={selectMedal(el.gameHoursPlayed)}
                  alt="Medal"
                  className="medal-icon"
                  role="button"
                  data-bs-toggle="popover"
                  data-bs-trigger="hover focus"
                  data-bs-container="body"
                  data-bs-placement="bottom"
                  data-bs-content={`${el.gameTitle} — ${el.gameHoursPlayed} horas`}
                />
                <img
                  className="img-fluid gameImg"
                  src={el.gameImage}
                  alt={`Portada de ${el.gameTitle}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: Bio, Tabs e Info */}
        <div className="right-panel">
          {/* Mensaje perfil vacío */}
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
          <div className="tabs">
            {['info', 'Games', 'comments'].map(tab => (
              <button
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>
          {activeTab === 'info' && (
            <div className="info-section container">
              {/* Nombre y Nickname */}
              <div className="row">
                {(['name', 'nick_name'] as const).map((f, i) => (
                  <div key={i} className="col-md-6">
                    <label>{f === 'nick_name' ? 'Nickname' : 'Name'}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile[f]}
                        onChange={e => handleInputChange(f, e.target.value)}
                        maxLength={11}
                      />
                    ) : (
                      <p>{profile[f]}</p>
                    )}
                  </div>
                ))}
              </div>
              {/* Age, Gender, Zodiac */}
              <div className="row">
                <div className="col-md-4">
                  <label>Age</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profile.age}
                      onChange={e => handleInputChange('age', +e.target.value)}
                      max={120}
                      min={1}
                    />
                  ) : (
                    <p>{profile.age}</p>
                  )}
                </div>
                <div className="col-md-4">
                  <label>Gender</label>
                  {isEditing ? (
                    <select
                      value={profile.gender}
                      onChange={e => handleInputChange('gender', e.target.value)}
                    >
                      {genders.map((g, idx) => <option key={idx}>{g}</option>)}
                    </select>
                  ) : (
                    <p>{profile.gender}</p>
                  )}
                </div>
                <div className="col-md-4">
                  <label>Zodiac</label>
                  {isEditing ? (
                    <select
                      value={profile.zodiac}
                      onChange={e => handleInputChange('zodiac', e.target.value)}
                    >
                      {zodiacSigns.map((z, idx) => <option key={idx}>{z}</option>)}
                    </select>
                  ) : (
                    <p>{profile.zodiac}</p>
                  )}
                </div>
              </div>
              {/* Contacto y preferencias */}
              <div className="row">
                {(['discord', 'steam_id'] as const).map((f, i) => (
                  <div key={i} className="col-md-6">
                    <label className="d-flex align-items-center gap-2 mt-1 mb-1">{f === 'steam_id' ? 'Steam Friend ID' : 'Discord'}
                      <div>
                        <span className="tooltip-wrapper">
                          <i className="fa-solid fa-circle-info fa-xl discord-info-icon"></i>
                          <span className="tooltip-text discord-info-tooltip-text">
                            <strong>Connect with your matches</strong>
                            <div>
                              The Discord or Steam info<br />
                              in your profile will be <br />
                              used by your matches<br />
                              to reach out to you.
                            </div>
                          </span>
                        </span>
                      </div>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile[f]}
                        onChange={e => handleInputChange(f, e.target.value)}
                        maxLength={30}
                      />
                    ) : (
                      <p>{profile[f]}</p>
                    )}
                  </div>
                ))}
                {/* MODAL DE PREFERENCES----------------------- */}
                <div className="gaming-prefs-box col-md-6">
                  <label>Gaming Preferences</label>
                  {isEditing ? (
                    <>
                      <div className="section-container">
                        <button
                          onClick={() => setShowGamingPreferencesModal(true)}
                          className="section-button"
                        >
                          Select Preferences
                        </button>
                        <p> {selectedGamingPreferences.length > 0
                          ? formatPreferences(selectedGamingPreferences)
                          : "No preferences selected yet."}</p>
                      </div>

                      {showGamingPreferencesModal && (
                        <GamingPreferencesModal
                          selected={selectedGamingPreferences}
                          setSelected={setSelectedGamingPreferences}
                          onSave={() => {
                            handleInputChange('preferences', formatPreferences(selectedGamingPreferences));
                            setShowGamingPreferencesModal(false);
                          }}
                          onCancel={() => setShowGamingPreferencesModal(false)}
                        />
                      )}
                    </>
                  ) : (
                    <p>
                      {profile.preferences && profile.preferences.trim().length > 0
                        ? profile.preferences
                        : "No preferences selected yet."}
                    </p>
                  )}
                </div>

                <div className="col-md-6">
                  <label>Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.location}
                      onChange={e => handleInputChange('location', e.target.value)}
                      maxLength={20}
                      minLength={4}
                    />
                  ) : (
                    <p>{profile.location}</p>
                  )}
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label className="">Languages</label>
                    {isEditing ? (
                      <>
                        <div className="section-container">
                          <button
                            onClick={() => setShowLanguageModal(true)}
                            className="section-button"
                          >
                            Select Languages
                          </button>
                          <p style={{ minHeight: "38px" }}>
                            {selectedLanguages.length > 0
                              ? formatPreferences(selectedLanguages)
                              : "No languages selected."}
                          </p>
                        </div>

                        {showLanguageModal && (
                          <LanguageModal
                            selected={selectedLanguages}
                            setSelected={setSelectedLanguages}
                            onSave={() => {
                              handleInputChange(
                                "languages",
                                formatPreferences(selectedLanguages)
                              );
                              setShowLanguageModal(false);
                            }}
                            onCancel={() => setShowLanguageModal(false)}
                          />
                        )}
                      </>
                    ) : (
                      <p style={{ minHeight: "38px" }}>
                        {profile.languages ? profile.languages : "No languages selected."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col text-left">
                  <button className="edit-btn" onClick={updateProfile}>
                    {isEditing ? 'Save' : 'Edit'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'Games' && (
            <div className="container info-section">
              <div className="row d-flex justify-content-around align-items-center">
                <h2 className="col-lg-6 col-md-12 col-sm-12 mt-3">
                  Games{" "}
                  <span className="tooltip-wrapper">
                    <i className="fa-solid fa-circle-info fa-2xs medals-info-icon"></i>
                    <span className="tooltip-text medal-info-tooltip-text">
                      <strong>Medal Info:</strong>
                      <div>
                        <i className="fa-solid fa-medal mt-1 medal-info-gold"></i> +2500 hours
                      </div>
                      <div>
                        <i className="fa-solid fa-medal mt-1 medal-info-silver"></i> +500 hours
                      </div>
                      <div>
                        <i className="fa-solid fa-medal mt-1 medal-info-bronze"></i> 0-500 hours
                      </div>
                    </span>
                  </span>
                </h2>
                <button
                  type="button"
                  className="btn botonLeaveComment col-lg-4 col-md-12 col-sm-12"
                  data-bs-toggle="modal"
                  data-bs-target="#commentModal"
                >
                  Add a new game
                </button>

                <div className="modal fade" id="commentModal" tabIndex={-1} aria-hidden="true">
                  <div className="modal-dialog">
                    <div className="modal-content modal-sci-fi">
                      <div className="modal-header modal-sci-fi-header">
                        <h5 className="modal-title modal-sci-fi-title" id="commentModalLabel">
                          Add a new game
                        </h5>
                        <button
                          type="button"
                          className="btn-close btn-sci-fi"
                          data-bs-dismiss="modal"
                          aria-label="Cerrar"
                        />
                      </div>
                      <div className="modal-body modal-sci-fi-body">
                        <div className="mb-3">
                          <label htmlFor="gameName" className="label-sci-fi">Select a game</label>
                          <Select
                            id="gameName"
                            className="selectorJuegos"
                            options={gameOptions}
                            value={gameOptions.find(opt => opt.value === game.title) || null}
                            onChange={(selected) =>
                              handleChange({ target: { name: 'title', value: selected?.value || "" } })
                            }
                            isClearable
                            isSearchable
                            placeholder="-- Select a game --"
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="hoursPlayed" className="label-sci-fi">Hours played</label>
                          <input
                            type="number"
                            className="input-sci-fi"
                            id="hoursPlayed"
                            name="hours_played"
                            value={game.hours_played}
                            onChange={handleChange}
                            placeholder="Eg.: 42"
                            min="1"
                            max="10000"
                          />
                          {errorHoursPlayed && <h6 className="text-danger ms-2 mt-2 ">{errorHoursPlayed}</h6>}
                          {errorRepeatedGame && <h6 className="text-danger ms-2 mt-2 ">{errorRepeatedGame}</h6>}
                        </div>
                      </div>
                      <div className="modal-footer modal-sci-fi-footer">
                        <button
                          type="button"
                          className="btn-sci-fi-primary"
                          data-bs-dismiss="modal"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-sci-fi-primary"
                          onClick={handleAdd}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row mt-5 gap-3 d-flez justify-content-center gamesbigbox p-2">
                {store.user?.profile?.games ? store.user.profile.games.map((el, i) => (
                  <div key={i} className="row gamesbox d-flex align-content-center py-3">
                    <div className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center">
                      <h6 className="m-0">{el.gameTitle}</h6>
                    </div>
                    {idOfGameBeingEdited === el.id ? (
                      <form className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center" onSubmit={(e) => handleSubmit(e, el.id)}>
                        <div className="row d-flex flex-row justify-content-around align-items-center">
                          {errorCeroHours && <h6 className="me-4 text-danger mt-2 error-hours-font">{errorCeroHours}</h6>}
                          <input className="col-auto input-hours border-2 rounded-2 ms-2" type="number" name="hours_played" value={game.hours_played} onChange={(e) => setGame({ ...game, hours_played: e.target.value })} placeholder="Hours" />
                          <button type="submit" className="me-1 fa-solid fa-solid fa-floppy-disk btn bg-transparent botonesAccionesJuegos btn-save-game col-auto" />
                          <span className="ms-1 text-danger botonesAccionesJuegos btn-close-edit-game col-auto col-auto" onClick={() => setIdOfGameBeingEdited(0)}>X</span>
                        </div>
                      </form>
                    ) : (
                      <div className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center">
                        <h6 className="m-0 col-4">{el.gameHoursPlayed} hours</h6>
                        <span className="text-light botonesAccionesJuegos col-auto fa-solid fa-pencil" onClick={() => setIdOfGameBeingEdited(el.id)}></span>
                        <span className="text-danger botonesAccionesJuegos col-auto fa-solid fa-trash" onClick={() => handleDeleteGame(el.id)}></span>
                      </div>
                    )}
                  </div>
                )) : <p>No games yet</p>}
              </div>
            </div>
          )}
          {activeTab === 'comments' && (
            <div className="info-section container">
              <div className="row justify-content-around">
                <h3 className="col-1 m-2 mb-4">Comments</h3>
                <div className="col-auto m-2 mb-4"></div>
              </div>
              <div className="row">
                {store.matchReviewsReceived?.reviews_received && store.matchReviewsReceived.reviews_received.length > 0 ? (
                  store.matchReviewsReceived.reviews_received.map(el => (
                    <div key={el.id} className="review-card">
                      <div className="review-container">
                        Author: {el.author_nickname} — {el.stars} ⭐️
                        <p className="m-0 border-0 review-box">
                          <span className="fa-solid fa-comment mx-2"></span>
                          {el.comment}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No comments yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Modal de selección de avatar */}
        {showModal && (
          <div className="modal-overlay">
            <div className="avatar-modal">
              <h3>Choose Your Avatar</h3>
              <div className="avatar-grid">
                {Object.keys(picMap).map((file, idx) => {
                  const currentPhotoKey = Object.entries(picMap).find(([, key]) => key === profile.photo)?.[0];
                  return (
                    <img
                      key={idx}
                      src={`/src/front/assets/img/profile-pics/${file}`}
                      alt={file}
                      className={file === currentPhotoKey ? 'selected' : ''}
                      onClick={() => handlePicChange(file)}
                    />
                  );
                })}
              </div>
              <button onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;

