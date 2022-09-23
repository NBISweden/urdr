import "../index.css";
import React, { useState } from "react";
import { AuthContext } from "../components/AuthProvider";

export const HeaderUser = ({ username }: { username: string }) => {
  const { logoutBackend, setUser } = React.useContext(AuthContext);

  const logout = async (e) => {
    const logout = await logoutBackend();
    if (logout) setUser(null);
  };

  return (
    <nav className="nav-wrapper">
      <div className="nav-user">{username}</div>
      <div className="nav-bar">|</div>
      <a className="nav-item" href="/help">
        Help
      </a>
      <a className="nav-item" href="/report">
        Report time
      </a>
      <a className="nav-item" href="/absence">
        Absence
      </a>
      <button type="button" className="nav-item" onClick={logout}>
        Log out
      </button>
    </nav>
  );
};
