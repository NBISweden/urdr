import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Buffer } from "buffer";
import { LoginHeader } from "../components/LoginHeader";
import { LoginError } from "../components/LoginError";
import "../index.css";
import { AuthContext } from "../components/AuthProvider";

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorCode, setErrorCode] = useState<null | number>(null);
  const navigate = useNavigate();
  const { onLogin } = React.useContext(AuthContext);

  const authenticateRedmine = async (event) => {
    event?.preventDefault();
    const loginResponse = await onLogin(username, password);

    // If everything goes right, onLogin will return a User object.
    // Otherwise it returns a number that is an error code
    if (typeof loginResponse === "number") {
      setErrorCode(loginResponse);
      return;
    }
    navigate("/report");
  };

  return (
    <main>
      <div className="login-wrapper">
        <LoginHeader />
        <form onSubmit={authenticateRedmine} className="login-form">
          <p className="login-info">
            This time logging interface is connected to Redmine. <br></br>Use
            your Redmine credentials to log in.
          </p>
          <label htmlFor="username" className="login-label">
            Username
          </label>
          <input
            className="login-field"
            type="text"
            id="username"
            value={username}
            placeholder="Enter your username"
            autoFocus
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="Password" className="login-label">
            Password
          </label>
          <input
            className="login-field"
            type="password"
            id="password"
            value={password}
            placeholder="Enter your password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <input
            type="submit"
            value="Login"
            className="basic-button login-button"
          />
        </form>
        {errorCode && <LoginError code={errorCode} />}
      </div>
    </main>
  );
};
