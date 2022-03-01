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
      <p className="col-6">{title}</p>
      {days.map((day) => {
        return <p className="col-1">{day}</p>;
      })}
    </div>
  );
};
