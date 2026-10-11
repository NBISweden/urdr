import "../index.css";
import React, { useState, useRef } from "react";
import { useAuth } from "../components/AuthProvider";
import { useEscaper } from "../utils";
import down from "../icons/caret-down-fill.svg";

export const HeaderUser = ({ username }: { username: string }) => {
  const { logoutBackend, setUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEscaper(menuRef, () => setIsMenuOpen(false));

  const logout = async () => {
    const logout = await logoutBackend();
    if (logout) setUser(null);
  };

  return (
    <nav className="nav-wrapper">
      <a className="nav-item" href="/help">
        Help
      </a>
      <a className="nav-item" href="/report">
        Report time
      </a>
      <a className="nav-item" href="/absence">
        Absence
      </a>
      <a className="nav-item" href="/vacation">
          Vacation Overview
      </a>
      <div className="nav-menu" ref={menuRef}>
        <button
          type="button"
          className="nav-user nav-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {username}
          <img className="nav-menu-caret" src={down} alt="" />
        </button>
        {isMenuOpen && (
          <div className="nav-menu-dropdown">
            <button type="button" className="nav-menu-item" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
