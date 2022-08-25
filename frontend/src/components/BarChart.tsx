import React from "react";
import chart from "../images/barchart_mock_notext.png";

export const BarChart = () => {
  const mockData = {
    Support: 126,
    Training: 59,
    Admin: 23,
    Consultation: 21,
    "Professional Development": 34,
  };

  const total = Object.values(mockData).reduce(
    (previousValue, currentValue) => previousValue + currentValue,
    0
  );

  const getPercent = (value: number) => {
    return Math.round((value / total) * 100);
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
                width: `${getPercent(mockData[key])}%`,
                backgroundColor: `${mockColors[index]}`,
              }}
              className="bar-chart-section"
            >
              <p>
                {key} {getPercent(mockData[key])}%
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
