import React, { useContext } from "react";
import { AuthContext } from "../components/AuthProvider";
import { Link } from "react-router-dom";
import "../index.css";

export const NotFound = () => {
  const { user } = useContext(AuthContext);

  return (
    <main className="not-found-wrapper">
      <header className="header-wrapper">
        <img src="mstile-70x70.png" alt="Urdr icon" />
        <h1 className="header-heading">urdr</h1>
      </header>
      <section className="not-found-section">
        <h2 className="not-found-heading">Page not found</h2>
        <p className="not-found-message">
          The page you are looking for does not exist.
        </p>
        {user ? (
          <Link to="/report">
            <button className="not-found-button">Go to Report</button>
          </Link>
        ) : (
          <Link to="/login">
            <button className="not-found-button">Go to Login</button>
          </Link>
        )}
      </section>
    </main>
  );
};
