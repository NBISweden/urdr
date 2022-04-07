import { AuthContext } from "./AuthProvider";
import React from "react";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);

  if (user === null) {
    return <Navigate to="/login" />;
  }

  return children;
};
