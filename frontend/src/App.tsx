import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Login } from "./pages/Login";
import { Report } from "./pages/Report";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getISOWeek } from "date-fns";

export const App = () => {
  const date: Date = new Date();
  const currentYear: number = date.getFullYear();
  const currentWeek: number = getISOWeek(date);

  return (
    <>
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate replace to="/report" />} />
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
