import React from "react";
import "./Private-navbar.css";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useProfileCompletion } from "../../hooks/useProfileCompletion";
import { getPhotoAsset, defaultPhoto } from "../../constants/photoAssets";

export const PrivateNavbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const { isComplete } = useProfileCompletion();

  const toggleDropdown = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch({ type: "logout", payload: null });
    navigate("/");
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const userPhoto = store.user?.profile?.photo
    ? getPhotoAsset(store.user.profile.photo)
    : defaultPhoto;

  const userNickname = store.user?.profile?.nick_name || "Player";

  return (
    <nav className="private-navbar">
      {/* Efecto de brillo superior */}
      <div className="navbar-glow" />

      {/* Logo */}
      <div className="navbar-left">
        {isComplete ? (
          <Link to="/private/profile" className="navbar-logo-link">
            <span className="navbar-logo">
              Player<span className="highlight">Link</span>
            </span>
          </Link>
        ) : (
          <span
            className="navbar-logo-link disabled"
            style={{ cursor: "not-allowed", opacity: 0.6 }}
          >
            <span className="navbar-logo">
              Player<span className="highlight">Link</span>
            </span>
          </span>
        )}
      </div>

      {/* Centro - Navegación rápida (opcional) */}
      <div className="navbar-center">
        {isComplete ? (
          <>
            <Link to="/private/search-a-mate" className="navbar-nav-link">
              <i className="fa-solid fa-magnifying-glass" />
              <span>Search</span>
            </Link>
            <Link to="/private/your-matches" className="navbar-nav-link">
              <i className="fa-solid fa-heart" />
              <span>Matches</span>
            </Link>
          </>
        ) : (
          <>
            <span
              className="navbar-nav-link disabled"
              style={{ cursor: "not-allowed", opacity: 0.6 }}
            >
              <i className="fa-solid fa-magnifying-glass" />
              <span>Search</span>
            </span>
            <span
              className="navbar-nav-link disabled"
              style={{ cursor: "not-allowed", opacity: 0.6 }}
            >
              <i className="fa-solid fa-heart" />
              <span>Matches</span>
            </span>
          </>
        )}
      </div>

      {/* Usuario */}
      <div className="navbar-right" ref={dropdownRef}>
        <button className="navbar-user-btn" onClick={toggleDropdown} aria-label="User menu">
          <div className="navbar-avatar-wrapper">
            <div className="navbar-avatar-ring" />
            <img src={userPhoto} alt="Avatar" className="navbar-avatar" />
          </div>
          <span className="navbar-username">{userNickname}</span>
          <i className={`fa-solid fa-chevron-down navbar-chevron ${menuOpen ? "open" : ""}`} />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="navbar-dropdown">
            {isComplete ? (
              <Link
                to="/private/profile"
                className="navbar-dropdown-item"
                onClick={() => setMenuOpen(false)}
              >
                <i className="fa-solid fa-user" />
                My Profile
              </Link>
            ) : (
              <span
                className="navbar-dropdown-item disabled"
                style={{ cursor: "not-allowed", opacity: 0.6 }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/private/onboarding");
                  setMenuOpen(false);
                }}
              >
                <i className="fa-solid fa-user" />
                My Profile
              </span>
            )}
            {isComplete ? (
              <Link
                to="/private/settings"
                className="navbar-dropdown-item"
                onClick={() => setMenuOpen(false)}
              >
                <i className="fa-solid fa-gear" />
                Settings
              </Link>
            ) : (
              <span
                className="navbar-dropdown-item disabled"
                style={{ cursor: "not-allowed", opacity: 0.6 }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/private/onboarding");
                  setMenuOpen(false);
                }}
              >
                <i className="fa-solid fa-gear" />
                Settings
              </span>
            )}
            <div className="navbar-dropdown-divider" />
            <button className="navbar-dropdown-item logout" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
