import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Report } from "./pages/Report";
import { AuthProvider, AuthContext } from "./components/AuthProvider";

const ProtectedRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);

  if (user === null) {
    return <Navigate to="/login" />;
  }

  return children;
};

export const App = () => {
  return (
    <>
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Login />} />

              <Route path="/login" element={<Login />} />
              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <Report />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    </>
  );
};
