import "../../pages/Privateviews/Search-mate.css";
import React, { useEffect, useState } from "react";
import { SearchMatchCard } from "../../components/SearchMatchCard/SearchMatchCard";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import searchMatchServices from "../../services/searchMatchServices";
import { ItsMatch } from "../../components/ItsMatch/ItsMatch";
import { useNavigate } from "react-router-dom";
import type { Profile } from "../../types";
import logoApp from "../../assets/img/logos/logo-app.png";

export const SearchMate: React.FC = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLoadingMessage, _setShowLoadingMessage] = useState<boolean>(false);

  // Para el modal del match y el componente match
  const [showMatchModal, setShowMatchModal] = useState<boolean>(false);
  const [matchProfile, setMatchProfile] = useState<Profile | null>(null);

  //Para quitar el retarto
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (!store.user) {
      navigate("/");
    }
  }, [navigate, store.user]);

  //Carga los perfiles
  useEffect(() => {
    if (!store.user || !store.user.id) return;

    const getProfiles = async () => {
      setLoading(true);
      try {
        const data = await searchMatchServices.getFilteredProfiles(store.user.id);

        // IDs de perfiles ya match o liked
        const matchedIds = store.userMatchesInfo?.map((m) => m.user_id) || [];
        // likesSent contiene profiles, así que usamos user_id o id
        const likedIds = store.likesSent?.map((l: any) => l.user_id || l.liked_id || l.id) || [];

        let allProfiles: Profile[] = [];
        if (Array.isArray(data)) {
          allProfiles = data;
        } else if (
          data &&
          typeof data === "object" &&
          "profiles" in data &&
          Array.isArray(data.profiles)
        ) {
          allProfiles = data.profiles;
        }

        // Filtra perfiles que NO estén en matchedIds ni likedIds
        const filteredProfiles = allProfiles.filter((profile) => {
          const profileId = profile.id || profile.user_id;
          return !matchedIds.includes(profileId) && !likedIds.includes(profileId);
        });

        dispatch({ type: "getSearchMatchProfiles", payload: filteredProfiles });
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    getProfiles();
  }, [store.user, store.userMatchesInfo, store.likesSent, dispatch]);

  // Resetear currentUser si cambia la lista de perfiles
  useEffect(() => {
    setCurrentUser(0);
  }, [store.searchMatchProfiles]);

  // Factorizar avance para no repetir lógica
  const advanceToNextProfile = () => {
    setCurrentUser((prev) => prev + 1);
    const remainingProfiles = store.searchMatchProfiles.filter((_, index) => index !== currentUser);
    dispatch({ type: "getSearchMatchProfilesFiltered", payload: remainingProfiles });
    setCurrentUser(0);
  };

  //Maneja likes
  const handleLike = async () => {
    if (isAnimating) return;
    setIsAnimating(true); // Oculta la tarjeta

    setTimeout(async () => {
      const likedProfile = store.searchMatchProfiles[currentUser];
      if (!store.user?.id || !likedProfile?.user_id) {
        setIsAnimating(false);
        return;
      }

      try {
        // El backend devuelve {like, match?} si hay match mutuo
        const likeResponse = await searchMatchServices.addLikeSent(
          store.user.id,
          likedProfile.user_id
        );

        // Verificar si hubo un match (el backend devuelve match cuando hay like mutuo)
        const hasMatch =
          likeResponse && typeof likeResponse === "object" && "match" in likeResponse;

        if (hasMatch) {
          // ¡Es un match! Usar el perfil completo que ya tenemos
          const matchUserInfo = {
            user_id: likedProfile.user_id,
            nickname: likedProfile.nick_name || "Unknown",
            games: likedProfile.games || [],
            gender: likedProfile.gender || "Unknown",
            age: likedProfile.age || 0,
            location: likedProfile.location || "Unknown",
          };

          dispatch({ type: "addMatch", payload: matchUserInfo });
          setMatchProfile(likedProfile);
          setShowMatchModal(true);
        } else {
          // No es match, solo guardar el like
          dispatch({ type: "saveLike", payload: likedProfile });
          advanceToNextProfile();
        }
      } catch (error) {
        console.error("Error en handleLike:", error);
        // En caso de error, avanzar al siguiente perfil
        advanceToNextProfile();
      } finally {
        setIsAnimating(false);
      }
    }, 500);
  };

  const handleDislike = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTimeout(async () => {
      const dislikedProfile = store.searchMatchProfiles[currentUser];
      if (!store.user?.id || !dislikedProfile?.user_id) return;

      try {
        await searchMatchServices.addDislikeSent(store.user.id, dislikedProfile.user_id);
        dispatch({ type: "saveDislike", payload: dislikedProfile });
      } catch (error) {
        console.error("Error sending dislike:", error);
      } finally {
        const remainingProfiles = store.searchMatchProfiles.filter(
          (_, index) => index !== currentUser
        );
        dispatch({ type: "getSearchMatchProfiles", payload: remainingProfiles });
        setCurrentUser(0);
        setIsAnimating(false);
      }
    }, 500);
  };

  //Maneja el cierre del modal
  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatchProfile(null);
    dispatch({ type: "getItsMatchInfo", payload: null });

    if (matchProfile) {
      const remainingProfiles = store.searchMatchProfiles.filter((profile) => {
        const profileId = profile.id || profile.user_id;
        const matchId = matchProfile.id || matchProfile.user_id;
        return profileId !== matchId;
      });

      dispatch({ type: "getSearchMatchProfiles", payload: remainingProfiles });
      setCurrentUser(0);
    }
  };

  //Mensaje si tarda al cargar nuevos users
  if (loading && showLoadingMessage) {
    return (
      <h2>
        <div className="spinner align-self-center search-mate-font"></div> Loading new players.
        Thank you for your patience {store.user?.profile?.nick_name || "player"}
      </h2>
    );
  }

  //Mensaje que muestra si no hay más users
  if (!loading && !showMatchModal && currentUser >= (store.searchMatchProfiles?.length || 0)) {
    return (
      <div className="no-players-empty-state">
        <div className="no-players-icon">
          <img src={logoApp} alt="PlayerLink Logo" className="no-players-logo" />
        </div>
        <h2 className="no-players-title">
          Sorry {store.user?.profile?.nick_name || "player"}, there are no more players around.
        </h2>
        <p className="no-players-message">
          Don&apos;t worry! New players join every day. Check back later to discover your next
          gaming partner.
        </p>
        <div className="no-players-actions">
          <button
            className="btn-refresh-profiles"
            onClick={() => window.location.reload()}
            type="button"
          >
            <i className="fa-solid fa-rotate"></i> Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showMatchModal && matchProfile ? (
        <>
          <div className="d-flex justify-content-center align-items-center search-mate-font ">
            <div>
              <h1 className="title-its-match-card-font-shadow mt-2 mb-3">It&apos;s a match</h1>
            </div>
            <div>
              <button
                type="button"
                className="btn-close ms-3 search-mate-btn-close-modal"
                onClick={closeMatchModal}
              />
            </div>
          </div>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body">
                <ItsMatch profile={matchProfile} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {store.searchMatchProfiles &&
            store.searchMatchProfiles.length > 0 &&
            store.searchMatchProfiles[currentUser] &&
            !isAnimating && (
              <SearchMatchCard
                profile={store.searchMatchProfiles[currentUser]}
                onLike={handleLike}
                onDislike={handleDislike}
              />
            )}
        </>
      )}
    </>
  );
};
