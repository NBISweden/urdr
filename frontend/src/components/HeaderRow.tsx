import React from "react";
import {
  getLongCustomDateString,
  getShortCustomDateString,
  useViewport,
} from "../utils";
import { isToday } from "date-fns";

export const HeaderRow = ({ days }: { days: Date[] }) => {
  const { width } = useViewport();
  const breakpoint = 1267;

  return (
    <div className="row">
      {days.map((day, index) => (
        <p
          key={day.getTime()}
          className={`${
            index === 0 ? "col-1 date-cell offset-6" : "col-1 date-cell"
          } ${isToday(day) ? "cell-today" : ""}`}
        >
          {width >= breakpoint
            ? getLongCustomDateString(day)
            : getShortCustomDateString(day)}
        </p>
      ))}
      <div className="col-1">
        <h2>Total</h2>
      </div>
    </div>
  );
};
