import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Report } from "./pages/Report";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const App = () => {
  return (
    <>
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate replace to="/report" />} />
              <Route
                path="/report/:year/:week"
                element={
                  <ProtectedRoute>
                    <Report />
                  </ProtectedRoute>
                }
              />

              <Route path="/login" element={<Login />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    </>
  );
};
