import { AuthContext } from "./AuthProvider";
import React from "react";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = React.useContext(AuthContext);
  if (user === null) {
    return <Navigate replace to="/login" />;
  }

  return children;
};
