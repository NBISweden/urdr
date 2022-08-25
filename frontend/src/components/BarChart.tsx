import React from "react";
import chart from "../images/barchart_mock_notext.png";
import { BarChartSection } from "./BarChartSection";

export const BarChart = () => {
  const mockData = {
    Support: 40,
    Training: 30,
    Admin: 10,
    Consultation: 15,
    "Professional Development": 5,
  };

  const mockColors = [
    "hotpink",
    "peachpuff",
    "lightgrey",
    "cornflowerblue",
    "coral",
    "yellow",
    "green",
  ];

  return (
    <section className="overview-wrapper">
      <h2 className="overview-heading">This year's work</h2>
      {/* <img src={chart} className="overview-bar" /> */}
      <div className="bar-chart-wrapper">
        {Object.keys(mockData).map((key, index) => {
          return (
            <div
              style={{
                width: `${mockData[key]}%`,
                backgroundColor: `${mockColors[index]}`,
              }}
              className="bar-chart-section"
            >
              <p>
                {key} {mockData[key]}%
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
