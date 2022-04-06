import "../index.css";
import React, { useState } from "react";
import { SNOWPACK_PUBLIC_API_URL } from "../utils";
import down from "../icons/caret-down-fill.svg";

const logout = async () => {
  await fetch(`${SNOWPACK_PUBLIC_API_URL}/api/logout`, {
    method: "POST",
  })
    .then((res) => {
      if (res.ok) {
        return true;
      } else {
        throw new Error("Could not log out.");
      }
    })
    .catch((error) => {
      console.log(error);
      return false;
    });
  // Redirect to login page
  window.location.href = "/";
};

const showSettings = () => {
  return (
    <div className="settings-list" aria-labelledby="dropdownMenuLink">
      <a className="dropdown-item" onClick={logout}>
        Log out
      </a>
    </div>
  );
};

export const HeaderUser = ({ username }: { username: string }) => {
  const [showUserSettings, setShowUserSettings] = useState<boolean>(false);

  const showSettingsClickHandle = () => {
    setShowUserSettings(!showUserSettings);
  };

  return (
    <div className="p-2">
      <a
        className="btn dropdown-button"
        onClick={showSettingsClickHandle}
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded={showUserSettings}
      >
        {username}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
        </svg>
      </a>
      {showUserSettings ? showSettings() : null}
    </div>
  );
};
