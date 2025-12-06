// Profile.tsx
// Componente de perfil de usuario con edición, selección de avatar, medallas de juego y sección de comentarios

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import "../../pages/Privateviews/Profile.css";

// Hooks y servicios
import useGlobalReducer from "../../hooks/useGlobalReducer";
import userServices from "../../services/userServices";
import reviewServices from "../../services/reviewServices";
import gameServices from "../../services/gameServices";
import apiClient from "../../services/apiClient";
import { parsePreferences } from "../../utils/formatters";

// Constants and assets
import { DEFAULT_VALUES, PHOTO_MAP } from "../../constants";

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

import { useNavigate } from "react-router-dom";
import type { Game } from "../../types";

declare global {
  interface Window {
    bootstrap: typeof import("bootstrap");
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
  const [loadingAvailableGames, setLoadingAvailableGames] = useState<boolean>(false);
  const { store, dispatch } = useGlobalReducer();
  const rawgApi = import.meta.env.VITE_RAWG_KEY;
  const gameOptions: SelectOption[] = availableGames.map((name) => ({ value: name, label: name }));

  // Estados locales
  const [activeTab, setActiveTab] = useState<string>("info");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [notice, setNotice] = useState<React.ReactNode>("");
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
    photo: DEFAULT_VALUES.PROFILE_PHOTO,
  });
  const clearNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estados de Modales languages y Gaming preferences
  const [showGamingPreferencesModal, setShowGamingPreferencesModal] = useState<boolean>(false);
  const [selectedGamingPreferences, setSelectedGamingPreferences] = useState<string[]>(
    parsePreferences(profile.preferences)
  );
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    parsePreferences(profile.languages)
  );

  // Usar useMemo para asegurar que se recalcule cuando cambie el store
  const allGames: Game[] = useMemo(() => {
    return store.user?.profile?.games ? store.user.profile.games : [];
  }, [store.user?.profile?.games]);

  const topThreeGames = useMemo(() => {
    return allGames
      .slice()
      .sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0))
      .slice(0, 3);
  }, [allGames]);

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

  // Definir funciones con useCallback antes de los useEffect que las usan
  const loadProfile = useCallback(async () => {
    try {
      const data = await userServices.getUserInfo();

      if (data instanceof Error) {
        console.error("Error loading profile:", data);
        if (!store.user) {
          navigate("/");
        }
        return;
      }

      if (!data || !data.user) {
        console.error("No user data received");
        if (!store.user) {
          navigate("/");
        }
        return;
      }

      await dispatch({ type: "getUserInfo", payload: data.user });

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
        !profileData.name ||
        profileData.name.length < 2 ||
        !profileData.nick_name ||
        profileData.nick_name.length < 2 ||
        !profileData.age ||
        profileData.age <= 0 ||
        !profileData.gender ||
        profileData.gender.length < 2 ||
        !profileData.location ||
        profileData.location.length < 2 ||
        !profileData.zodiac ||
        profileData.zodiac.length < 2 ||
        !profileData.discord ||
        profileData.discord.length < 2 ||
        !profileData.steam ||
        profileData.steam.length < 2 ||
        !profileData.language ||
        profileData.language.length < 2 ||
        !profileData.preferences ||
        profileData.preferences.length < 2 ||
        !profileData.bio ||
        profileData.bio.length < 2 ||
        !profileData.photo ||
        profileData.photo.length < 2;

      if (isIncomplete) {
        setNotice(
          <h4 className="text-center text-danger">
            <i className="fa-solid fa-triangle-exclamation text-warning fa-xl"></i> Profile
            incomplete. Remember to complete it to unlock the full potential of PlayerLink.
          </h4>
        );
        clearNoticeTimerRef.current = setTimeout(() => setNotice(""), 10000);
      }
    } catch (error) {
      console.error("Error en loadProfile:", error);
    }
  }, [store.user, navigate, dispatch]);

  const getReviews = useCallback(async () => {
    if (!store.user?.id) return;
    reviewServices.getAllReviewsReceived(store.user.id).then((data) => {
      if (!(data instanceof Error)) {
        dispatch({ type: "matchReviewsReceived", payload: data });
      }
    });
  }, [store.user?.id, dispatch]);

  const fetchGames = useCallback(async () => {
    setLoadingAvailableGames(true);
    try {
      // Verificar que la API key esté disponible
      if (!rawgApi) {
        console.error("RAWG API key no está configurada");
        setNotice(
          <h4 className="text-center text-danger">
            <i className="fa-solid fa-triangle-exclamation text-warning fa-xl"></i>
            Error: API key de RAWG no configurada. Por favor, contacta al administrador.
          </h4>
        );
        setLoadingAvailableGames(false);
        return;
      }

      const pageSize = 40;
      const pages = 25;
      let allGames: string[] = [];

      // Agregar delay entre peticiones para evitar rate limiting
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      for (let page = 1; page <= pages; page++) {
        try {
          const resp = await fetch(
            `https://api.rawg.io/api/games?key=${rawgApi}&page_size=${pageSize}&page=${page}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (!resp.ok) {
            // Si es un error 429 (rate limit), esperar más tiempo
            if (resp.status === 429) {
              const retryAfter = resp.headers.get("Retry-After");
              const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
              console.warn(`Rate limit alcanzado. Esperando ${waitTime}ms...`);
              await delay(waitTime);
              page--; // Reintentar la misma página
              continue;
            }

            // Si es un error 401/403, la API key es inválida
            if (resp.status === 401 || resp.status === 403) {
              throw new Error("API key de RAWG inválida o expirada");
            }

            throw new Error(`Error cargando juegos: ${resp.status} ${resp.statusText}`);
          }

          const data = await resp.json();

          if (!data.results || !Array.isArray(data.results)) {
            console.warn(`Página ${page}: formato de respuesta inesperado`);
            break;
          }

          allGames = allGames.concat(data.results.map((g: { name: string }) => g.name));

          // Si no hay más resultados, salir del loop
          if (data.results.length === 0 || !data.next) {
            break;
          }

          // Delay entre peticiones para evitar rate limiting (excepto en la última)
          if (page < pages) {
            await delay(200); // 200ms entre peticiones
          }
        } catch (pageError) {
          console.error(`Error en página ${page}:`, pageError);
          // Continuar con la siguiente página en lugar de fallar completamente
          if (pageError instanceof Error && pageError.message.includes("API key")) {
            throw pageError; // Re-lanzar errores de API key
          }
          // Para otros errores, continuar con las siguientes páginas
          await delay(1000); // Esperar un poco más antes de continuar
        }
      }

      if (allGames.length === 0) {
        throw new Error("No se pudieron cargar juegos desde RAWG");
      }

      setAvailableGames(allGames);
    } catch (err) {
      console.error("RAWG fetch error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido al cargar juegos";
      setNotice(
        <h4 className="text-center text-danger">
          <i className="fa-solid fa-triangle-exclamation text-warning fa-xl"></i>
          {errorMessage}
        </h4>
      );
      // Limpiar el mensaje después de 10 segundos
      setTimeout(() => setNotice(""), 10000);
    } finally {
      setLoadingAvailableGames(false);
    }
  }, [rawgApi]);

  // Carga inicial de perfil y reviews recibidos
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userFromStorage = localStorage.getItem("user");

    if (!token) {
      navigate("/");
      return;
    }

    // Evitar múltiples llamadas simultáneas
    let isMounted = true;
    let loadProfileTimeout: ReturnType<typeof setTimeout> | null = null;
    let hasLoaded = false;

    const loadProfileIfNeeded = async () => {
      if (!isMounted || hasLoaded) return;
      hasLoaded = true;

      if (!store.user && userFromStorage) {
        try {
          const userObj = JSON.parse(userFromStorage);
          dispatch({ type: "getUserInfo", payload: userObj });
          // Esperar un poco antes de cargar el perfil completo para evitar rate limiting
          loadProfileTimeout = setTimeout(async () => {
            if (isMounted) {
              await loadProfile();
            }
          }, 1000); // Aumentado a 1 segundo para dar más tiempo
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
          if (isMounted) {
            await loadProfile();
          }
        }
      } else if (store.user && store.user.profile) {
        // Si ya tenemos el usuario con perfil, no necesitamos recargar inmediatamente
        // Solo recargar si el perfil está incompleto
        const profile = store.user.profile;
        const isIncomplete = !profile.games || profile.games.length === 0;
        if (isIncomplete) {
          // Esperar un poco antes de cargar para evitar rate limiting
          loadProfileTimeout = setTimeout(async () => {
            if (isMounted) {
              await loadProfile();
            }
          }, 1000);
        }
      }
    };

    loadProfileIfNeeded();

    return () => {
      isMounted = false;
      hasLoaded = false;
      if (clearNoticeTimerRef.current) {
        clearTimeout(clearNoticeTimerRef.current);
      }
      if (loadProfileTimeout) {
        clearTimeout(loadProfileTimeout);
      }
    };
  }, [navigate, dispatch, store.user?.id, loadProfile, store.user]);

  // Sincronizar el estado local profile cuando cambie store.user.profile
  useEffect(() => {
    const profileData = store.user?.profile;
    if (profileData) {
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
    }
  }, [store.user?.profile]);

  useEffect(() => {
    // Limpiar popovers anteriores
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      if (window.bootstrap?.Popover) {
        const popover = window.bootstrap.Popover.getInstance(el);
        if (popover) popover.dispose();
      }
    });

    // Inicializar popovers actuales
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
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
  }, [activeTab, availableGames.length, fetchGames, getReviews]);

  const handlePicChange = async (fileName: string) => {
    if (!store.user?.id) {
      console.error("User not available");
      return;
    }
    const newKey = picMap[fileName] || DEFAULT_VALUES.PROFILE_PHOTO;
    try {
      await userServices.changeUserPhoto(store.user.id, { photo: newKey });

      // Actualizar estado local
      setProfile((prev) => ({ ...prev, photo: newKey }));

      // Actualizar store global para que persista al navegar
      if (store.user?.profile) {
        const updatedUser = {
          ...store.user,
          profile: {
            ...store.user.profile,
            photo: newKey,
          },
        };
        dispatch({ type: "getUserInfo", payload: updatedUser });
      }
    } catch (err) {
      console.error("Error al cambiar foto:", err);
    } finally {
      setShowModal(false);
    }
  };

  const updateProfile = async () => {
    if (!store.user || !store.user.id) {
      console.error("User not available");
      return;
    }

    if (isEditing) {
      if (store.user.profile) {
        try {
          const response = await apiClient.put(`/api/profiles/${store.user.id}`, profile, true);
          if (!response.ok) throw new Error("Error al guardar perfil");
          await userServices.getUserInfo(0, true);
          await loadProfile();
        } catch (err) {
          console.error("Error en updateProfile:", err);
        }
      } else {
        try {
          const response = await apiClient.post(`/api/profiles/${store.user.id}`, profile, true);
          if (!response.ok) throw new Error("Error al guardar perfil");
          await userServices.getUserInfo(0, true);
          await loadProfile();
        } catch (err) {
          console.error("Error en updateProfile:", err);
        }
      }
    }

    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: keyof ProfileState, value: string | number) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const selectGameImage = async (gameTitle: string): Promise<string | null> => {
    try {
      if (!rawgApi) {
        console.error("RAWG API key no está configurada");
        return null;
      }

      const response = await fetch(
        `https://api.rawg.io/api/games?key=${rawgApi}&search=${encodeURIComponent(gameTitle)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("Rate limit alcanzado al buscar imagen del juego");
          return null;
        }
        if (response.status === 401 || response.status === 403) {
          console.error("API key de RAWG inválida o expirada");
          return null;
        }
        throw new Error(`Error al buscar juego: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.warn("No se encontraron resultados para:", gameTitle);
        return null;
      }

      const game = data.results[0];
      return game.background_image || null;
    } catch (error) {
      console.error("Error al obtener la imagen del juego:", error);
      return null;
    }
  };

  const handleAddGame = async (gameData: GameFormData) => {
    if (!store.user?.profile?.id) {
      console.error("User profile not available");
      setNotice(
        <h4 className="text-center text-danger">
          <i className="fa-solid fa-triangle-exclamation text-warning fa-xl"></i>
          Error: Perfil de usuario no disponible
        </h4>
      );
      if (clearNoticeTimerRef.current) {
        clearTimeout(clearNoticeTimerRef.current);
      }
      clearNoticeTimerRef.current = setTimeout(() => setNotice(""), 5000);
      return;
    }

    try {
      const image = await selectGameImage(gameData.title);
      const newGame = {
        ...gameData,
        image: image || "",
      };

      // Añadir el juego al backend
      const response = await gameServices.postNewGame(store.user.profile.id, newGame);

      // Actualizar optimistamente el store con el nuevo juego
      if (store.user?.profile?.games && response?.game) {
        const updatedGames = [...store.user.profile.games, response.game];
        const updatedUser = {
          ...store.user,
          profile: {
            ...store.user.profile,
            games: updatedGames,
          },
        };
        dispatch({ type: "getUserInfo", payload: updatedUser });
      }

      // No es necesario recargar el perfil - el store ya está actualizado con la respuesta del backend
      // Solo recargamos en caso de error (en el catch)

      // Limpiar cualquier mensaje de error previo
      if (clearNoticeTimerRef.current) {
        clearTimeout(clearNoticeTimerRef.current);
      }
      setNotice("");
    } catch (err) {
      console.error("Error al agregar juego:", err);

      // Si hay error, revertir la actualización optimista recargando el perfil
      await loadProfile();

      const errorMessage = err instanceof Error ? err.message : "Error al agregar el juego";

      setNotice(
        <h4 className="text-center text-danger">
          <i className="fa-solid fa-triangle-exclamation text-warning fa-xl"></i>
          {errorMessage}
        </h4>
      );
      if (clearNoticeTimerRef.current) {
        clearTimeout(clearNoticeTimerRef.current);
      }
      clearNoticeTimerRef.current = setTimeout(() => setNotice(""), 5000);
    }
  };

  const handleDeleteGame = async (game_id: number) => {
    try {
      // Actualizar optimistamente el store antes de la petición
      if (store.user?.profile?.games) {
        const updatedGames = store.user.profile.games.filter((game) => game.id !== game_id);
        const updatedUser = {
          ...store.user,
          profile: {
            ...store.user.profile,
            games: updatedGames,
          },
        };
        dispatch({ type: "getUserInfo", payload: updatedUser });
      }

      // Eliminar en el backend
      await gameServices.deleteGameById(game_id);

      // No es necesario recargar el perfil - la actualización optimista ya es correcta
      // Solo recargamos en caso de error (en el catch)

      // Limpiar cualquier mensaje de error previo
      if (clearNoticeTimerRef.current) {
        clearTimeout(clearNoticeTimerRef.current);
      }
      setNotice("");
    } catch (err) {
      console.error("Error al eliminar juego:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar el juego";

      // Si el juego no existe, simplemente recargar el perfil para sincronizar
      if (errorMessage.includes("not found")) {
        await loadProfile();
        return;
      }

      // Si hay error, revertir la actualización optimista recargando el perfil
      await loadProfile();

      // Para otros errores, mostrar un mensaje
      setNotice(
        <h4 className="text-center text-danger">
          <i className="fa-solid fa-triangle-exclamation text-warning fa-xl"></i>
          {errorMessage}
        </h4>
      );
      if (clearNoticeTimerRef.current) {
        clearTimeout(clearNoticeTimerRef.current);
      }
      clearNoticeTimerRef.current = setTimeout(() => setNotice(""), 5000);
    }
  };

  const handleUpdateGame = async (game_id: number, hours: number) => {
    try {
      // Actualizar optimistamente el store antes de la petición
      if (store.user?.profile?.games) {
        const updatedGames = store.user.profile.games.map((game) =>
          game.id === game_id ? { ...game, gameHoursPlayed: hours } : game
        );
        const updatedUser = {
          ...store.user,
          profile: {
            ...store.user.profile,
            games: updatedGames,
          },
        };
        dispatch({ type: "getUserInfo", payload: updatedUser });
      }

      // Actualizar en el backend
      await gameServices.updateGameInfo(game_id, hours);

      // No es necesario recargar el perfil - la actualización optimista ya es correcta
      // Solo recargamos en caso de error (en el catch)

      // Limpiar cualquier mensaje de error previo
      if (clearNoticeTimerRef.current) {
        clearTimeout(clearNoticeTimerRef.current);
      }
      setNotice("");
    } catch (err) {
      console.error("Error al actualizar juego:", err);

      // Si hay error, revertir la actualización optimista recargando el perfil
      await loadProfile();

      const errorMessage =
        err instanceof Error ? err.message : "Error al actualizar las horas del juego";

      setNotice(
        <h4 className="text-center text-danger">
          <i className="fa-solid fa-triangle-exclamation text-warning fa-xl"></i>
          {errorMessage}
        </h4>
      );
      if (clearNoticeTimerRef.current) {
        clearTimeout(clearNoticeTimerRef.current);
      }
      clearNoticeTimerRef.current = setTimeout(() => setNotice(""), 5000);
    }
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
          bio={profile.bio}
          topThreeGames={topThreeGames}
          onPhotoEdit={() => setShowModal(true)}
          isEditing={isEditing}
          onBioChange={(value) => handleInputChange("bio", value)}
        />

        <div className="right-panel">
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "info" && (
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

          {activeTab === "Games" && (
            <ProfileGamesTab
              games={allGames}
              availableGames={availableGames}
              gameOptions={gameOptions}
              loading={loadingAvailableGames}
              onAddGame={handleAddGame}
              onDeleteGame={handleDeleteGame}
              onUpdateGame={handleUpdateGame}
            />
          )}

          {activeTab === "comments" && <ProfileReviewsTab reviews={reviews} />}
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
