import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import matchServices from "../../services/matchServices";
import { MatchMiniCard } from "../../components/matchMiniCard";
import logoApp from "../../assets/img/logos/logo-app.png";
import "./Your-matches.css";

export const YourMatches: React.FC = () => {
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState<boolean>(true);
  const isLoadingRef = useRef<boolean>(false);
  const lastUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!store.user || store.user === "undefined") {
      navigate("/");
      return;
    }

    const userId = store.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    // Si cambió el usuario, resetear la referencia
    if (lastUserIdRef.current !== null && lastUserIdRef.current !== userId) {
      isLoadingRef.current = false;
    }

    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      return;
    }

    let isMounted = true;
    isLoadingRef.current = true;
    lastUserIdRef.current = userId;

    setLoading(true);

    matchServices
      .getAllMatchesInfo(userId)
      .then((data) => {
        if (isMounted) {
          if (data instanceof Error) {
            console.error("Error loading matches:", data);
            dispatch({ type: "getAllMatchesInfo", payload: [] });
          } else {
            const matches = data.matches || [];
            dispatch({ type: "getAllMatchesInfo", payload: matches });
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load matches:", err);
          dispatch({ type: "getAllMatchesInfo", payload: [] });
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
          isLoadingRef.current = false;
        }
      });

    return () => {
      isMounted = false;
      isLoadingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, store.user?.id]);

  return (
    <div className="container-fluid px-2 px-sm-4">
      <div className="row gy-4">
        {loading ? (
          <div className="col-12">
            <div className="loading-matches-state">
              <div className="loading-matches-spinner"></div>
              <h4 className="loading-matches-text">Loading matches...</h4>
            </div>
          </div>
        ) : (
          <>
            {Array.isArray(store.userMatchesInfo) && store.userMatchesInfo.length > 0 ? (
              store.userMatchesInfo
                .slice()
                .sort((a, b) => {
                  // Ordenar del más reciente al más antiguo
                  const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return dateB - dateA; // Orden descendente (más reciente primero)
                })
                .map((el, index) => (
                  <div
                    key={el.user_id || el.match_id || `match-${index}`}
                    className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-12"
                  >
                    <MatchMiniCard
                      id={el.user_id || el.id}
                      nickname={el.nickname}
                      gender={el.gender}
                      games={el.games}
                      age={el.age}
                      location={el.location}
                      photo={el.photo}
                      index={index}
                    />
                  </div>
                ))
            ) : (
              <div className="no-matches-empty-state">
                <div className="no-matches-icon">
                  <img src={logoApp} alt="PlayerLink Logo" className="no-matches-logo" />
                </div>
                <h2 className="no-matches-title">No matches yet!</h2>
                <p className="no-matches-message">
                  Your perfect gaming buddy might be just one search away!
                </p>
                <div className="no-matches-actions">
                  <button
                    className="btn-search-now"
                    onClick={() => navigate("/private/search-a-mate")}
                    type="button"
                  >
                    <i className="fa-solid fa-magnifying-glass"></i> Start Searching
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
