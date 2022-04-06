import React, { useState } from "react";
import { User } from "../model";
import { SNOWPACK_PUBLIC_API_URL } from "../utils";
import { Buffer } from "buffer";

export const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState();

  React.useEffect(() => {
    const user = JSON.parse(window.localStorage.getItem("user"));
    setUser(user);
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  const handleLogin = async (username, password) => {
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
          return response.json();
        } else {
          console.log("Error: login failed");
        }
      })
      .catch((error) => console.log("An error occured.", error));

    setUser(user);
    return user;
  };
  // This will only listen to changes on value

  const handleLogout = async () => {
    const logout = await fetch(`${SNOWPACK_PUBLIC_API_URL}/api/logout`, {
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
    setUser(null);
    return () => {
      navigate("/login");
    };
  };

  const value = {
    user,
    setUser,
    onLogin: handleLogin,
    onLogout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
