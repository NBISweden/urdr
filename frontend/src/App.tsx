import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Reporter } from "./pages/Reporter";

export const App = () => {
  return (
    <>
      <React.StrictMode>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/report" element={<Reporter />} />
          </Routes>
        </BrowserRouter>
      </React.StrictMode>
    </>
  );
};
