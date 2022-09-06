import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Report } from "./pages/Report";
import { Help } from "./pages/Help";
import { VacationPlanner } from "./pages/VacationPlanner";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getISOWeek } from "date-fns";

// Route calls
// Order of routes is critical.
// First check for /login, the for the expected /report/year/week.
// If none of these apply, redirect to /report/year/week using
// current year and week and replace the history element.
export const App = () => {
  const currentYear: number = new Date().getFullYear();
  const currentWeek: number = getISOWeek(new Date());

  return (
    <>
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/report/:year/:week"
                element={
                  <ProtectedRoute>
                    <Report />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <Navigate
                    replace
                    to={`/report/${currentYear}/${currentWeek}`}
                  />
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                }
              />
              {/*
                <Route
                  path="/vacation"
                  element={
                    <ProtectedRoute>
                      <VacationPlanner />
                    </ProtectedRoute>
                  }
                />
              */}
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    </>
  );
};
