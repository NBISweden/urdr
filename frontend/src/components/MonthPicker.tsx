import React from "react";
import DatePicker from "react-datepicker";
import { addMonths, subMonths } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import left from "../icons/caret-left-fill.svg";
import right from "../icons/caret-right-fill.svg";

type Props = {
  onMonthDateChange: (newDate: Date) => void;
  startDate: Date;
};

export const MonthPicker: React.FC<Props> = ({
  startDate,
  onMonthDateChange,
}) => {
  return (
    <div className="time-travel">
      <button
        type="button"
        onClick={() => onMonthDateChange(subMonths(startDate, 1))}
        className="week-arrow-button"
      >
        <img src={left} alt="switch to previous month" className="week-arrow" />
      </button>
      <label htmlFor="month-picker" className="visually-hidden">
        Month
      </label>
      <DatePicker
        id="month-picker"
        selected={startDate}
        onChange={(date: Date | null) => {
          if (date) onMonthDateChange(date);
        }}
        dateFormat="MMMM yyyy"
        locale={enGB}
        className="month-picker-input"
        calendarClassName="month-picker-calendar"
        showMonthYearPicker
        showFullMonthYearPicker
      />
      <button
        type="button"
        onClick={() => onMonthDateChange(addMonths(startDate, 1))}
        className="week-arrow-button"
      >
        <img src={right} alt="switch to next month" className="week-arrow" />
      </button>
    </div>
  );
};
