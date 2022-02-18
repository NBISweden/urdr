import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Reporter } from "./pages/Reporter";

export const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Login />} />
          <Route path="/report" element={<Reporter />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};
