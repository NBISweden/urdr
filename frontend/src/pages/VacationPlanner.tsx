import "../index.css";
import React, { useState, useRef } from "react";
import { AuthContext } from "../components/AuthProvider";
import { Toast } from "../components/Toast";
import { ToastMsg, TimeEntry } from "../model";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import sv from "date-fns/locale/sv";
import { reportTime, dateFormat, isWeekday } from "../utils";
import { eachDayOfInterval, Interval, format as formatDate } from "date-fns";

export const VacationPlanner = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [toastList, setToastList] = useState<ToastMsg[]>([]);

  const handleCloseToast = (index: number) => {
    const toasts = [...toastList];
    toasts.splice(index, 1);
    setToastList(toasts);
    return;
  };

  const onVacationReportError = (error: any) => {
    setToastList([
      ...toastList,
      {
        type: "warning",
        timeout: 5000,
        message: error.message,
      },
    ]);
    return false;
  };

  const reportVacationTime = async () => {
    const dates_interval: Interval = { start: startDate, end: endDate };
    const all_days = eachDayOfInterval(dates_interval);
    let reportable_days = all_days.slice();
    reportable_days = reportable_days.filter((date) => isWeekday(date));

    for await (let vacation_day of reportable_days) {
      const time_entry: TimeEntry = {
        issue_id: 3499,
        activity_id: 19,
        hours: 8,
        comments: "",
        spent_on: formatDate(vacation_day, dateFormat),
      };
      const saved = await reportTime(
        time_entry,
        onVacationReportError,
        context
      );

      if (!saved) {
        setToastList([
          ...toastList,
          {
            type: "warning",
            timeout: 5000,
            message:
              "Something went wrong! Your vacation plan could not be submitted",
          },
        ]);
      }
    }
  };

  const validateDates = async () => {
    if (!startDate || !endDate) {
      setToastList([
        ...toastList,
        {
          type: "warning",
          timeout: 10000,
          message:
            "Please fill in both the starting and end date of your absence",
        },
      ]);
    } else if (
      startDate.getTime() &&
      endDate.getTime() &&
      endDate > startDate
    ) {
      await reportVacationTime();
      setToastList([
        ...toastList,
        {
          type: "info",
          timeout: 10000,
          message: "Vacation plan submitted!",
        },
      ]);
    } else {
      setToastList([
        ...toastList,
        {
          type: "warning",
          timeout: 10000,
          message: "Invalid reporting period date ranges",
        },
      ]);
    }
  };

  const context = React.useContext(AuthContext);

  const FromDatePicker = () => (
    <div>
      <DatePicker
        isClearable={true}
        selected={startDate}
        onChange={(date: Date) => setStartDate(date)}
        showWeekNumbers
        minDate={new Date()}
        maxDate={new Date("2030-01-01")}
        locale={sv}
        showYearDropdown
        todayButton="Idag"
      />
    </div>
  );

  const ToDatePicker = () => (
    <div>
      <DatePicker
        isClearable={true}
        selected={endDate}
        onChange={(date: Date) => setEndDate(date)}
        showWeekNumbers
        minDate={startDate}
        maxDate={new Date("2030-01-01")}
        locale={sv}
        showYearDropdown
        todayButton="Idag"
      />
    </div>
  );

  return (
    <>
      <header>
        <h3>Vacation reporting </h3>
      </header>
      <main>
        <div className="vacation-plan-dates-wrapper">
          <div className="vacation-plan-container">
            <label
              htmlFor="vacation-plan-picker"
              className="vacation-plan-picker-label"
            >
              From:
            </label>
            <FromDatePicker />
          </div>
          <div className="vacation-plan-container">
            <label
              htmlFor="vacation-plan-picker"
              className="vacation-plan-picker-label"
            >
              To:
            </label>
            <ToDatePicker />
          </div>
          <div className="vacation-plan-container">
            <button
              type="button"
              className="basic-button apply-dates-button"
              title="Apply selected dates"
              onClick={() => validateDates()}
            >
              Submit
            </button>
          </div>
        </div>
        {toastList.length > 0 && (
          <Toast onCloseToast={handleCloseToast} toastList={toastList} />
        )}
      </main>
    </>
  );
};
