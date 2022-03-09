import React from "react";

export const HeaderRow = ({ title, days }: { title: string; days: Date[] }) => {
  const dayStrings = days.map((day) => {
    return day.toISOString().split("T")[0];
  });
  return (
    <div className="row">
      <h2 className="col-6">{title}</h2>
      {dayStrings.map((day) => {
        return (
          <p key={day} className="col-1">
            {day}
          </p>
        );
      })}
    </div>
  );
};
