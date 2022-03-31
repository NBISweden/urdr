import "../index.css";
import React, { useState } from "react";
import { weekNumber } from "weeknumber";

export const TimeTravel = ({
  weekTravelDay,
  onWeekTravel,
}: {
  weekTravelDay: Date;
  onWeekTravel: (newDay: Date) => void;
}) => {
  const [currentWeek, setCurrentWeek] = useState<number>(
    weekNumber(weekTravelDay)
  );

  const previousWeeksClickHandle = () => {
    const nextDate = new Date(
      weekTravelDay.setDate(weekTravelDay.getDate() - 7)
    );
    onWeekTravel(nextDate);
    setCurrentWeek(weekNumber(nextDate));
  };
  const nextWeeksClickHandle = () => {
    const nextDate = new Date(
      weekTravelDay.setDate(weekTravelDay.getDate() + 7)
    );
    onWeekTravel(nextDate);
    setCurrentWeek(weekNumber(nextDate));
  };

  return (
    <div className="d-flex justify-content-between header-time-travel">
      <a
        onClick={previousWeeksClickHandle}
        className="header-time-travel week-button"
      >
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
