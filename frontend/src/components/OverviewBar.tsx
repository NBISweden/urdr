import React from "react";
import chart from "../images/barchart_mock_notext.png";

export const OverviewBar = () => {
  return (
    <section className="overview-wrapper">
      <h2 className="overview-heading">This year's work</h2>
      <img src={chart} className="overview-bar" />
    </section>
  );
};
