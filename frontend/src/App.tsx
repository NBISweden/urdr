import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Report } from "./pages/Report";
import { Help } from "./pages/Help";
import { AbsencePlanner } from "./pages/AbsencePlanner";
import { VacationOverview } from "./pages/VacationOverview";
import { NotFound } from "./pages/NotFound";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getISOWeek, getISOWeekYear } from "date-fns";
import { ConfirmDialogProvider } from "./components/ConfirmDialogProvider";
import { EditPeriodDialogProvider } from "./components/EditPeriodDialogProvider";

// Route calls
// Order of routes is critical.
// First check is for the root path ("/"), which will redirect to the
// report page with the current year and week.
// Next check is for /login, then for the expected /report/year/week.
// If none of these apply, redirect to /report/year/week using
// current year and week and replace the history element.
// If none of the routes match, the NotFound component will be rendered.


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
                  <Route
                    path="/"
                    element={
                      <Navigate
                        replace
                        to={`/report/${currentYear}/${currentWeek}`}
                      />
                    }
                  />
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
                    path="/report"
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
                  <Route
                    path="/vacation"
                    element={
                      <ProtectedRoute>
                        <VacationOverview />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ConfirmDialogProvider>
            </EditPeriodDialogProvider>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    </>
  );
};
