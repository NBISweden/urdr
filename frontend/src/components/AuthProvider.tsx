import React, { useState } from "react";
import { User } from "../model";
import { PUBLIC_API_URL } from "../utils";
import { Buffer } from "buffer";
import { useNavigate } from "react-router-dom";

export interface AuthContextValue {
  user: User | null | undefined;
  setUser: React.Dispatch<React.SetStateAction<User | null | undefined>>;
  onLogin: (
    username: string,
    password: string
  ) => Promise<User | number | undefined>;
  logoutBackend: () => Promise<boolean>;
}

export const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>();
  const navigate = useNavigate();

  React.useEffect(() => {
    let didCancel = false;
    let user = window.localStorage.getItem("user");
    if (!didCancel && user) setUser(JSON.parse(user));
    return () => {
      didCancel = true;
    };
  }, []);

  React.useEffect(() => {
    if (user) window.localStorage.setItem("user", JSON.stringify(user));
    else window.localStorage.removeItem("user");
  }, [user]);

  const handleLogin = async (username: string, password: string) => {
    // We are not doing account linking
    let headers = new Headers();
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    headers.set(
      "Authorization",
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
    );
    let errorCode: number | undefined;
    const user: User = await fetch(`${PUBLIC_API_URL}/api/login`, {
      method: "POST",
      credentials: "include",
      headers: headers,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          errorCode = response.status;
        }
      })
      .catch((error) => console.log("An error occured.", error));
    if (user) {
      setUser(user);
      return user;
    } else {
      return errorCode;
    }
  };
  // This will only listen to changes on value

  const handleLogout = async () => {
    const logout = await fetch(`${PUBLIC_API_URL}/api/logout`, {
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
    return logout;
  };

  const value: AuthContextValue = {
    user,
    setUser: setUser,
    onLogin: handleLogin,
    logoutBackend: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
