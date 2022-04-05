import React, { useState } from "react";
import { User } from "../model";
import { SNOWPACK_PUBLIC_API_URL } from "../utils";
import { Buffer } from "buffer";

export const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);

  const authenticateRedmine = async (username, password) => {
    // We are not doing account linking
    let headers = new Headers();
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    headers.set(
      "Authorization",
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
    );

    const user: User = await fetch(`${SNOWPACK_PUBLIC_API_URL}/api/login`, {
      body: "",
      method: "POST",
      credentials: "include",
      headers: headers,
    })
      .then((response) => {
        if (response.ok) {
          console.log(response);
          return response.json();
        } else {
          console.log("Error: login failed");
        }
      })
      .catch((error) => console.log("An error occured.", error));
    console.log(user);

    return user;
  };

  const handleLogin = async (username, password) => {
    console.log(username, password);
    const user = await authenticateRedmine(username, password);

    setUser(user);
    return user;
  };

  const handleLogout = () => {
    setUser(null);
  };

  const value = {
    user,
    onLogin: handleLogin,
    onLogout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
