import React from "react";
import { useAuth } from "../components/AuthProvider";
import { HeaderUser } from "../components/HeaderUser";

export const EuReport = () => {
  const context = useAuth();

  return (
    <>
      <header className="page-header">
        <h1 className="help-title">EU report</h1>
        <HeaderUser username={context.user ? context.user.login : ""} />
      </header>
      <main className="help-wrapper">
        <p className="help-info">Not implemented yet.</p>
      </main>
    </>
  );
};
