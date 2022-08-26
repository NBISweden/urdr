import React from "react";
import ActivityChart from "./ActivityChart";

export const Sidebar = () => {
  return (
    <div className="side-content">
      <h1>Time Overview</h1>
      <ActivityChart></ActivityChart>
    </div>
  );
};
