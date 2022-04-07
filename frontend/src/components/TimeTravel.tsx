import "../index.css";
import React, { useState, forwardRef } from "react";
import { getISOWeek } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import sv from "date-fns/locale/sv";
import left from "../icons/caret-left-fill.svg";
import right from "../icons/caret-right-fill.svg";

export const TimeTravel = ({
  weekTravelDay,
  onWeekTravel,
  currentWeekArray,
}: {
  weekTravelDay: Date;
  onWeekTravel: (newDay: Date) => void;
  currentWeekArray: Date[];
}) => {
  const [currentWeek, setCurrentWeek] = useState<number>(
    getISOWeek(weekTravelDay)
  );

  const handleDateChange = (dates: Date[]) => {
    setCurrentWeek(getISOWeek(dates[0]));
    onWeekTravel(dates[0]);
  };

  const previousWeeksClickHandle = () => {
    const nextDate = new Date(
      weekTravelDay.setDate(weekTravelDay.getDate() - 7)
    );
    onWeekTravel(nextDate);
    setCurrentWeek(getISOWeek(nextDate));
  };
  const nextWeeksClickHandle = () => {
    const nextDate = new Date(
      weekTravelDay.setDate(weekTravelDay.getDate() + 7)
    );
    onWeekTravel(nextDate);
    setCurrentWeek(getISOWeek(nextDate));
  };

  const CustomDatePickerInput = forwardRef(({ onClick }, ref) => (
    <button onClick={onClick} className="week-button" ref={ref}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z" />
        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
      </svg>
      Week {`${currentWeek}`}
    </button>
  ));

  const isWeekday = (dt: Date) => {
    const day = dt.getDay();
    return day !== 0 && day !== 6;
  };

  return (
    <div className="time-travel">
      <button onClick={previousWeeksClickHandle} className="week-arrow-button">
        <img src={left} alt="left arrow" className="week-arrow" />
      </button>
      <DatePicker
        onChange={(date) => handleDateChange(date)}
        showWeekNumbers
        filterDate={isWeekday}
        customInput={<CustomDatePickerInput />}
        startDate={currentWeekArray[0]}
        endDate={currentWeekArray[4]}
        selectsRange
        locale={sv}
        showYearDropdown
        todayButton="Idag"
        withPortal
      />
      <button onClick={nextWeeksClickHandle} className="week-arrow-button">
        <img src={right} alt="right arrow" className="week-arrow" />
      </button>
    </div>
  );
};
