import "../index.css";
import React, { useState, forwardRef } from "react";
import { getISOWeek, getISOWeekYear } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import sv from "date-fns/locale/sv";
import left from "../icons/caret-left-fill.svg";
import right from "../icons/caret-right-fill.svg";
import { useNavigate } from "react-router-dom";
import { isWeekday } from "../utils";

/*
TimeTravel
Provide a date picker with navigation buttons on each side for switching weeks.

Parameters & properties:
- weekTravelDay    = the last day of the displayed week
- onWeekTravel     = any day in the week to be displayed?
- currentWeekArray = a list of the dates in the displayed week
- currentWeek      = the number of the current/displayed week

Rendering is triggered by changing currentWeek (using setCurrentWeek()).
*/
export const TimeTravel = ({
  weekTravelDay,
  onWeekTravel,
  currentWeekArray,
}: {
  weekTravelDay: Date;
  onWeekTravel: (newDay: Date) => void;
  currentWeekArray: Date[];
}) => {
  // Week number is calculated from weekTravelDay
  const [currentWeek, setCurrentWeek] = useState<number>(
    getISOWeek(weekTravelDay)
  );
  // Change current week if weekTravelDay has changed.
  // This is needed to make the datepicker respond to browser back- and forward-button navigation.
  React.useEffect(() => {
    setCurrentWeek(getISOWeek(weekTravelDay));
  }, [weekTravelDay]);

  // For navigation according to week number
  const navigate = useNavigate();

  // Date changed using the date picker
  // Year for the url must be calculated w getISOWeekYear to handle year transitions.
  const handleDateChange = (dates: Date[]) => {
    setCurrentWeek(getISOWeek(dates[0]));
    onWeekTravel(dates[0]);
    navigate(`/report/${getISOWeekYear(dates[0])}/${getISOWeek(dates[0])}`);
  };

  // Click on previous week button.
  // Calculate new date for end-of-week and set new week number based on that.
  // Year for the url must be calculated w getISOWeekYear to handle year transitions.
  const previousWeeksClickHandle = () => {
    const nextDate = new Date(
      weekTravelDay.setDate(weekTravelDay.getDate() - 7)
    );
    onWeekTravel(nextDate);
    setCurrentWeek(getISOWeek(nextDate));
    navigate(`/report/${getISOWeekYear(nextDate)}/${getISOWeek(nextDate)}`);
  };

  // Click on next week button
  const nextWeeksClickHandle = () => {
    const nextDate = new Date(
      weekTravelDay.setDate(weekTravelDay.getDate() + 7)
    );
    onWeekTravel(nextDate);
    setCurrentWeek(getISOWeek(nextDate));
    navigate(`/report/${getISOWeekYear(nextDate)}/${getISOWeek(nextDate)}`);
  };

  // Date picker
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

  // The calculated time-travel section
  return (
    <div className="time-travel">
      <button onClick={previousWeeksClickHandle} className="week-arrow-button">
        <img src={left} alt="switch to previous week" className="week-arrow" />
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
      />
      <button onClick={nextWeeksClickHandle} className="week-arrow-button">
        <img src={right} alt="switch to next week" className="week-arrow" />
      </button>
    </div>
  );
};
