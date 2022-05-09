import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Buffer } from "buffer";
import { LoginHeader } from "../components/LoginHeader";
import "../index.css";
import { AuthContext } from "../components/AuthProvider";

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();
  const { onLogin } = React.useContext(AuthContext);

  const authenticateRedmine = async (event) => {
    event?.preventDefault();
    const loginResponse = await onLogin(username, password);

    if (loginResponse === 401) {
      setShowError(true);
      return;
    }
    navigate("/report");
  };

  return (
    <main>
      <div className="login-wrapper">
        <LoginHeader />
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
        {showError && (
          <div>
            <p>Wrong combination of username and password.</p>
          </div>
        )}
      </div>
    </main>
  );
};
