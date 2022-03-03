import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Report } from "./pages/Report";

export const App = () => {
  return (
    <>
      <React.StrictMode>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </BrowserRouter>
      </React.StrictMode>
    </>
  );
};
