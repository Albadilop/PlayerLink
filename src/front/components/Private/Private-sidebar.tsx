import React from "react";
import "./private-sidebar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";

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

  const links: SidebarLink[] = [
    { to: "/private/profile", icon: "fa-solid fa-user", label: "Profile" },
    { to: "/private/search-a-mate", icon: "fa-solid fa-magnifying-glass", label: "Search a Mate" },
    { to: "/private/your-matches", icon: "fa-solid fa-heart", label: "Your Matches" },
    { to: "/private/find-games", icon: "fa-solid fa-gamepad", label: "Find Games" },
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
          {links.map((link, index) => (
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
          ))}
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
