import React from "react";
import "./private-sidebar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useProfileCompletion } from "../../hooks/useProfileCompletion";

interface SidebarProps {
  activePath: string;
}

interface SidebarLink {
  to: string;
  icon: string;
  label: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePath: _activePath }) => {
  const [open, setOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();
  const { isComplete } = useProfileCompletion();

  const links: SidebarLink[] = [
    { to: "/private/profile", icon: "fa-solid fa-user", label: "Profile" },
    { to: "/private/search-a-mate", icon: "fa-solid fa-magnifying-glass", label: "Search a Mate" },
    { to: "/private/your-matches", icon: "fa-solid fa-heart", label: "Your Matches" },
    { to: "/private/find-games", icon: "fa-solid fa-gamepad", label: "PlayerLink AI" },
    { to: "/private/settings", icon: "fa-solid fa-gear", label: "Settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch({ type: "logout", payload: null });
    navigate("/");
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  return (
    <>
      {/* Mobile Toggle */}
      <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle sidebar">
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} />
      </button>

      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* Glow effect */}
        <div className="sidebar-glow" />

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          {links.map((link, index) => {
            // Disable links to profile, search, matches, find games, and settings if onboarding is incomplete
            const isRestrictedRoute =
              !isComplete &&
              (link.to === "/private/profile" ||
                link.to === "/private/search-a-mate" ||
                link.to === "/private/your-matches" ||
                link.to === "/private/find-games" ||
                link.to === "/private/settings");

            if (isRestrictedRoute) {
              return (
                <span
                  key={link.to}
                  className="sidebar-link disabled"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/private/onboarding");
                    setOpen(false);
                  }}
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    cursor: "not-allowed",
                    opacity: 0.6,
                  }}
                >
                  <span className="sidebar-link-indicator" />
                  <i className={`sidebar-link-icon ${link.icon}`} />
                  <span className="sidebar-link-text">{link.label}</span>
                </span>
              );
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className="sidebar-link-indicator" />
                <i className={`sidebar-link-icon ${link.icon}`} />
                <span className="sidebar-link-text">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button onClick={handleLogout} className="sidebar-logout">
          <i className="fa-solid fa-right-from-bracket" />
          <span>Log out</span>
        </button>
      </aside>
    </>
  );
};
