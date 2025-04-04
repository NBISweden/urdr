import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Report } from "./pages/Report";
import { Help } from "./pages/Help";
import { AbsencePlanner } from "./pages/AbsencePlanner";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getISOWeek, getISOWeekYear } from "date-fns";
import { ConfirmDialogProvider } from "./components/ConfirmDialogProvider";
import { EditPeriodDialogProvider } from "./components/EditPeriodDialogProvider";

// Route calls
// Order of routes is critical.
// First check for /login, the for the expected /report/year/week.
// If none of these apply, redirect to /report/year/week using
// current year and week and replace the history element.
export const App = () => {
  const currentYear: number = getISOWeekYear(new Date());
  const currentWeek: number = getISOWeek(new Date());

  return (
    <>
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <EditPeriodDialogProvider>
              <ConfirmDialogProvider>
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
                  <Route
                    path="/absence"
                    element={
                      <ProtectedRoute>
                        <AbsencePlanner />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </ConfirmDialogProvider>
            </EditPeriodDialogProvider>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    </>
  );
};
