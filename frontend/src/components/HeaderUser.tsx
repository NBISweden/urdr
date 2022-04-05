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
        <img src={down} className="down-arrow" />
      </a>
      {showUserSettings ? showSettings() : null}
    </div>
  );
};
