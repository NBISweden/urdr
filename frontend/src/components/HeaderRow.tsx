import React from "react";

export const HeaderRow = ({
  title,
  days,
}: {
  title: string;
  days: string[];
}) => {
  return (
    <div className="row">
      <h2 className="col-6">{title}</h2>
      {days.map((day) => {
        return (
          <p key={day} className="col-1">
            {day}
          </p>
        );
      })}
    </div>
  );
};
