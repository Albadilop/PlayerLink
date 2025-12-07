import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!store.user || store.user === "undefined") {
      navigate("/");
    } else {
      matchServices
        .getAllMatchesInfo(store.user?.id)
        .then((data) => {
          dispatch({ type: "getAllMatchesInfo", payload: data.matches });
        })
        .finally(() => setLoading(false)); // desactiva loading al finalizar
    }
  }, [navigate, store.user, dispatch]);

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
                    className="col-lg-3 col-md-6 col-sm-12"
                  >
                    <MatchMiniCard
                      id={el.user_id}
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
