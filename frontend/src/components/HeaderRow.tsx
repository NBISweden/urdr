import React from "react";

export const HeaderRow = ({ days }: { days: Date[] }) => {
  const dayStrings = days.map((day) => {
    return day.toISOString().split("T")[0];
  });
  return (
    <div className="row">
      {dayStrings.map((day, index) => {
        return (
          <p key={day} className={index === 0 ? "col-1 offset-6" : "col-1"}>
            {day}
          </p>
        );
      })}
    </div>
  );
};
