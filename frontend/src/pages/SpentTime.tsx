import "../index.css";
import React, { useState, useRef } from "react";
import { AuthContext } from "../components/AuthProvider";
import { getTimeEntries } from "../utils";
import { FetchedTimeEntry } from "model";
import { format as formatDate } from "date-fns";
import { dateFormat } from "../utils";
import { Toast } from "../components/Toast";
import { ToastMsg } from "../model";

export const SpentTime = () => {
  const [spentTime, setSpentTime] = useState<{}>({});

  //  Reporting period goes from 1st of December until 30th of November.
  const currentYear: number = new Date().getFullYear();
  const start_reporting_period = new Date(currentYear - 1, 11, 1);
  const end_reporting_period = new Date(currentYear, 10, 30);

  const [startDate, setStartDate] = useState<Date>(start_reporting_period);
  const [endDate, setEndDate] = useState<Date>(end_reporting_period);
  const [toastList, setToastList] = useState<ToastMsg[]>([]);

  const handleCloseToast = (index: number) => {
    const toasts = [...toastList];
    toasts.splice(index, 1);
    setToastList(toasts);
    return;
  };

  const getHoursPerActivity = async () => {
    const timeEntries = await getTimeEntries(
      undefined,
      startDate,
      endDate,
      context
    );
    let activityHours = {};
    timeEntries.map((entry: FetchedTimeEntry) => {
      if (!activityHours[entry.activity.name]) {
        activityHours[entry.activity.name] = 0;
      }
      activityHours[entry.activity.name] += entry.hours;
    });
    setSpentTime(activityHours);
  };

  const validateDates = () => {
    if (fromInputRef.current && toInputRef.current) {
      let from_date: Date = new Date(fromInputRef.current.value);
      let to_date: Date = new Date(toInputRef.current.value);
      if (from_date.getTime() && to_date.getTime()) {
        //console.log(to_date);
        setStartDate(from_date);
        //console.log(from_date);
        setEndDate(to_date);
        getHoursPerActivity();
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
    }
  };

  const validateDateChanges = (e: any, isFromDate: boolean) => {
    let sel_date: Date = new Date(e.target.value);
    if (!sel_date.getTime()) {
      if (isFromDate) {
        fromInputRef.current.className = "invalid";
      } else {
        toInputRef.current.className = "invalid";
      }
    } else {
      if (isFromDate) {
        fromInputRef.current.className = "";
      } else {
        toInputRef.current.className = "";
      }
    }
  };

  React.useEffect(() => {
    getHoursPerActivity();
  }, []);

  const context = React.useContext(AuthContext);
  const fmt_start_date: string = formatDate(startDate, dateFormat);
  const fmt_end_date: string = formatDate(endDate, dateFormat);
  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);

  const FromDatePicker = () => (
    <div>
      <input
        ref={fromInputRef}
        autoComplete="off"
        type="date"
        defaultValue={fmt_start_date}
        id="spent-time-picker"
        pattern="\d{4}-\d{2}-\d{2}"
        min="2000-01-01"
        max="3000-01-01"
        onChange={(e) => validateDateChanges(e, true)}
      ></input>
    </div>
  );

  const ToDatePicker = () => (
    <div>
      <input
        ref={toInputRef}
        autoComplete="off"
        type="date"
        defaultValue={fmt_end_date}
        id="spent-time-picker"
        pattern="\d{4}-\d{2}-\d{2}"
        min="2000-01-01"
        max="3000-01-01"
        onChange={(e) => validateDateChanges(e, false)}
      ></input>
    </div>
  );

  return (
    <>
      <header>
        <h3>{"Reporting period " + fmt_start_date + " - " + fmt_end_date}</h3>
      </header>
      <main>
        <div className="spent-time-dates-wrapper">
          <div className="spent-time-container">
            <label
              htmlFor="spent-time-picker"
              className="spent-time-picker-label"
            >
              From:
            </label>
            <FromDatePicker />
          </div>
          <div className="spent-time-container">
            <label
              htmlFor="spent-time-picker"
              className="spent-time-picker-label"
            >
              To:
            </label>
            <ToDatePicker />
          </div>
          <div className="spent-time-container">
            <button
              type="button"
              className="basic-button apply-dates-button"
              title="Apply selected dates"
              onClick={() => validateDates()}
            >
              Apply
            </button>
          </div>
        </div>
        <p>{JSON.stringify(spentTime)}</p>
        {toastList.length > 0 && (
          <Toast onCloseToast={handleCloseToast} toastList={toastList} />
        )}
      </main>
    </>
  );
};
