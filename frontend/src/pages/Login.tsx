import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";

import "../app.css";

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const authenticateRedmine = (event) => {
    event?.preventDefault();
    // We are not doing account linking
    let headers = new Headers();
    headers.set("Authorization", "Basic " + btoa(username + ":" + password));
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");

    fetch("http://localhost:8080/api/login", {
      body: "",
      method: "POST",
      credentials: "include",
      headers: headers,
    }).then((response) => {
      if (response.ok) {
        navigate("/report");
      } else {
        console.log("Error: login failed");
        setUsername("");
        setPassword("");
      }
    });
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
