import "../index.css";
import React, { useState } from "react";
import { SNOWPACK_PUBLIC_API_URL } from "../utils";
import down from "../icons/caret-down-fill.svg";
import { AuthContext } from "../components/AuthProvider";

export const HeaderUser = ({ username }: { username: string }) => {
  const { logoutBackend, logoutFrontend } = React.useContext(AuthContext);

  const [showUserSettings, setShowUserSettings] = useState<boolean>(false);

  const showSettingsClickHandle = () => {
    setShowUserSettings(!showUserSettings);
  };

  const logout = (event) => {
    event.preventDefault();
    const logout = logoutBackend();
    if (logout) logoutFrontend();
  };

  const showSettings = () => {
    return (
      <ul className="settings-box" aria-labelledby="dropdownMenuLink">
        <li className="settings-list-item">
          <a className="dropdown-item settings-list-link" onClick={logout}>
            Logout
          </a>
        </li>
      </ul>
    );
  };

  return (
    <div className="p-2 settings-wrapper">
      <a
        className="btn dropdown-button"
        onClick={showSettingsClickHandle}
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded={showUserSettings}
      >
        {username}
        {showUserSettings ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
          </svg>
        )}
      </a>
      {showUserSettings ? showSettings() : null}
    </div>
  );
};
