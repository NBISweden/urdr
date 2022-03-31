import "../index.css";
import React, { useState } from "react";
import { weekNumber } from "weeknumber";
import { getFullWeek } from "../utils";

export const TimeTravel = ({
  weekTravelDay,
  setWeekTravelDay,
  setCurrentWeekArray,
}: {
  weekTravelDay: Date;
  setWeekTravelDay: any;
  setCurrentWeekArray: any;
}) => {
  const [currentWeek, setCurrentWeek] = useState<number>(
    weekNumber(weekTravelDay)
  );

  const previousWeeksClickHandle = () => {
    const nextDate = new Date(
      weekTravelDay.setDate(weekTravelDay.getDate() - 7)
    );
    setWeekTravelDay(nextDate);
    setCurrentWeekArray(getFullWeek(nextDate));
    setCurrentWeek(weekNumber(nextDate));
  };
  const nextWeeksClickHandle = () => {
    const nextDate = new Date(
      weekTravelDay.setDate(weekTravelDay.getDate() + 7)
    );
    setWeekTravelDay(nextDate);
    setCurrentWeekArray(getFullWeek(nextDate));
    setCurrentWeek(weekNumber(nextDate));
  };

  return (
    <div className="d-flex justify-content-between header-time-travel">
      <a
        onClick={previousWeeksClickHandle}
        className="header-time-travel week-button"
      >
        {" "}
        ◀ Previous week
      </a>
      <label className="header-time-travel"> Week {`${currentWeek}`}</label>
      <a
        onClick={nextWeeksClickHandle}
        className="header-time-travel week-button"
      >
        Next week ▶
      </a>
    </div>
  );
};
