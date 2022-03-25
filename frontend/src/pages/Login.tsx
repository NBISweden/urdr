import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Buffer } from "buffer";
import { Header } from "../components/Header";
import "../index.css";
import { User, SNOWPACK_PUBLIC_API_URL } from "../model";

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const authenticateRedmine = async (event) => {
    event?.preventDefault();
    // We are not doing account linking
    let headers = new Headers();
    headers.set(
      "Authorization",
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
    );
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");

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
          setUsername("");
          setPassword("");
        }
      })
      .catch((error) => console.log("An error occured.", error));

    if (!user) {
      console.log("Something went wrong!");
      return;
    }
    navigate("/report", { state: user });
  };

  return (
    <div className="login-wrapper">
      <Header />
      <form onSubmit={authenticateRedmine} className="login-form">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          value={username}
          placeholder="Enter your username"
          autoFocus
          onChange={(event) => setUsername(event.target.value)}
        />
        <label htmlFor="Password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          placeholder="Enter you password"
          onChange={(event) => setPassword(event.target.value)}
        />
        <input type="submit" value="Login" className="login-button" />
      </form>
    </div>
  );
};
