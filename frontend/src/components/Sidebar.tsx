import React from "react";
import piemock from "../images/piemock.png";

export const Sidebar = () => {
  return (
    <div className="side-content">
      <h1>Time Overview</h1>
      <img src={piemock} alt="mock of chart" className="piemock-img" />
    </div>
  );
};
