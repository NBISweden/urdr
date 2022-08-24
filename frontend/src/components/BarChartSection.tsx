import React from "react";

export const BarChartSection = ({
  percentage,
  label,
  color,
}: {
  percentage: number;
  label: string;
  color: string;
}) => {
  return (
    <div
      style={{ width: `${percentage}%`, "background-color": `${color}` }}
      className="bar-chart-section"
    >
      <p>
        {label} {percentage}%
      </p>
    </div>
  );
};
