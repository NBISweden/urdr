import "../index.css";
import React, { useState, forwardRef } from "react";
import { getISOWeek } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import sv from "date-fns/locale/sv";

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
    <button onClick={onClick} className="header-time-travel" ref={ref}>
      Week {`${currentWeek}`}
    </button>
  ));

  const isWeekday = (dt: Date) => {
    const day = dt.getDay();
    return day !== 0 && day !== 6;
  };

  return (
    <>
      <a
        onClick={previousWeeksClickHandle}
        className="header-time-travel week-button"
      >
        ◀ Previous week
      </a>
      <DatePicker
        wrapperClassName="header-time-travel header-week"
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
      <a
        onClick={nextWeeksClickHandle}
        className="header-time-travel week-button"
      >
        Next week ▶
      </a>
    </>
  );
};
