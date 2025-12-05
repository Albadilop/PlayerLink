import "./Private-navbar.css";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export const PrivateNavbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { store } = useGlobalReducer();

  const toggleDropdown = () => setMenuOpen(!menuOpen);
  const closeDropdown = () => setMenuOpen(false);

  // Que se cierre el drop si le damos toque o fuera.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <nav className="private-navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo-link">
          <span className="navbar-logo">
            Player<span className="highlight">Link</span>
          </span>
        </Link>
      </div>
    </nav>
  );
};


