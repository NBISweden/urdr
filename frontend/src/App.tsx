import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Report } from "./pages/Report";
import { AuthProvider, AuthContext } from "./components/AuthProvider";

const ProtectedRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <>
      <AuthProvider>
        <React.StrictMode>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />

              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <Report />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </React.StrictMode>
      </AuthProvider>
    </>
  );
};
