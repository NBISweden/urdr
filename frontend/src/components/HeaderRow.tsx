import React from "react";
import {
  getLongCustomDateString,
  getShortCustomDateString,
  useViewport,
} from "../utils";

export const HeaderRow = ({ days }: { days: Date[] }) => {
  const { width } = useViewport();
  const breakpoint = 1044;
  const longDayStrings = days.map((day) => {
    return getLongCustomDateString(day);
  });

  const shortDayStrings = days.map((day) => {
    return getShortCustomDateString(day);
  });

  const Dates = ({ dayStrings }: { dayStrings: string[] }) => {
    return (
      <>
        {dayStrings.map((day, index) => {
          return (
            <p key={day} className={index === 0 ? "col-1 offset-6" : "col-1"}>
              {day}
            </p>
          );
        })}
      </>
    );
  };

  return (
    <div className="row">
      {width >= breakpoint ? (
        <Dates dayStrings={longDayStrings} />
      ) : (
        <Dates dayStrings={shortDayStrings} />
      )}
    </div>
  );
};
