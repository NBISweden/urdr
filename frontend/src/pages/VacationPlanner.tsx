import "../index.css";
import React, { useState, useRef } from "react";
import { AuthContext } from "../components/AuthProvider";
import { Toast } from "../components/Toast";
import {
  ToastMsg,
  TimeEntry,
  IssueActivityPair,
  FetchedTimeEntry,
  Issue,
  IdName,
} from "../model";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import sv from "date-fns/locale/sv";
import {
  reportTime,
  dateFormat,
  isWeekday,
  getTimeEntries,
  getFullWeek,
  getUsersInGroups,
  getGroups,
} from "../utils";
import {
  eachDayOfInterval,
  getISOWeek,
  Interval,
  format as formatDate,
} from "date-fns";
import LoadingOverlay from "react-loading-overlay-ts";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";

export const VacationPlanner = () => {
  const [startDate, setStartDate] = useState<Date>(undefined);
  const [endDate, setEndDate] = useState<Date>(undefined);
  const [toastList, setToastList] = useState<ToastMsg[]>([]);
  const [vacationWeeklyHours, setVacationWeeklyHours] = useState<[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [redmineGroups, setRedmineGroups] = useState({});

  const toggleLoadingPage = (state: boolean) => {
    setIsLoading(state);
  };

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

  React.useEffect(() => {
    toggleLoadingPage(true);
    const fetchTimeEntriesFromGroups = async () => {
      const users: number[] = await getUsersInGroups(context);
      const redmine_groups: [{ id: number; name: string }] = await getGroups(
        context
      );
      const obj_groups = {};
      redmine_groups.map((gr) => {
        obj_groups[gr.id] = gr.name;
      });

      setRedmineGroups(obj_groups);
      let uniqueUsers: number[] = [...new Set(users)];

      // So that loading times are shorter, we only take six groups
      let sliced_users = uniqueUsers.slice(-6);
      const vacation_entries: {}[] = [];
      for await (let group of sliced_users) {
        let vacationHours = await getVacationTimeEntries(
          new Date(),
          group.toString()
        );
        vacation_entries.push(vacationHours);
      }
      toggleLoadingPage(false);

      setVacationWeeklyHours([...vacationWeeklyHours, vacation_entries]);
    };
    fetchTimeEntriesFromGroups();
  }, []);

  const getVacationTimeEntries = async (fromday: Date, user_id: string) => {
    const issue: Issue = {
      id: 3499,
      subject: "NBIS General - Absence (Vacation/VAB/Other)",
    };
    const id_name: IdName = { id: 19, name: "Absence (Vacation/VAB/Other)" };
    const vacation_pair: IssueActivityPair = {
      issue: issue,
      activity: id_name,
      custom_name: "",
      is_hidden: false,
    };
    let vacationHours = {};

    const currentWeekArray: Date[] = getFullWeek(fromday);
    const currentYear: number = new Date().getFullYear();
    const januaryThisYear: Date = new Date(currentYear);
    const vacationTimeEntries = await getTimeEntries(
      vacation_pair,
      januaryThisYear,
      currentWeekArray[0],
      context,
      user_id
    );

    vacationTimeEntries.map((entry: FetchedTimeEntry) => {
      const currentWeek: string = getISOWeek(
        new Date(entry.spent_on)
      ).toString();

      if (!vacationHours[currentWeek]) {
        vacationHours[currentWeek] = 0;
      }
      vacationHours[currentWeek] += entry.hours;
    });
    return vacationHours;
  };

  const reportVacationTime = async (reportable_days: Date[]) => {
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
      const dates_interval: Interval = { start: startDate, end: endDate };
      const all_days = eachDayOfInterval(dates_interval);
      let reportable_days = all_days.slice();
      reportable_days = reportable_days.filter((date) => isWeekday(date));
      if (reportable_days.length > 100) {
        setToastList([
          ...toastList,
          {
            type: "warning",
            timeout: 5000,
            message:
              "You may only report a maximum of 100 absence days at a time",
          },
        ]);
      } else {
        await reportVacationTime(reportable_days);
        setStartDate(undefined);
        setEndDate(undefined);
        setToastList([
          ...toastList,
          {
            type: "info",
            timeout: 10000,
            message: "Vacation plan submitted!",
          },
        ]);
      }
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
        dateFormat={dateFormat}
        isClearable={true}
        selected={startDate ? startDate : undefined}
        onChange={(date: Date) => setStartDate(date)}
        showWeekNumbers
        minDate={new Date()}
        maxDate={new Date("2030-01-01")}
        locale={sv}
        showYearDropdown
        todayButton="Idag"
        selectsStart
        startDate={startDate}
        endDate={endDate}
        monthsShown={2}
      />
    </div>
  );

  const ToDatePicker = () => (
    <div>
      <DatePicker
        dateFormat={dateFormat}
        isClearable={true}
        selected={endDate ? endDate : undefined}
        onChange={(date: Date) => setEndDate(date)}
        showWeekNumbers
        minDate={startDate}
        maxDate={new Date("2030-01-01")}
        locale={sv}
        showYearDropdown
        todayButton="Idag"
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        monthsShown={2}
      />
    </div>
  );

  return (
    <>
      <LoadingOverlay
        active={isLoading}
        className={isLoading ? "loading-overlay" : ""}
        spinner={
          <ClimbingBoxLoader
            color="hsl(76deg 55% 53%)"
            loading={isLoading}
            size={15}
            width={4}
            height={6}
            radius={4}
            margin={4}
          ></ClimbingBoxLoader>
        }
      ></LoadingOverlay>
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
        <h3>Reported weekly vacation in the last year</h3>
        <div>{JSON.stringify(Object.values(redmineGroups))}</div>
        <div>{JSON.stringify(vacationWeeklyHours)}</div>
        {toastList.length > 0 && (
          <Toast onCloseToast={handleCloseToast} toastList={toastList} />
        )}
      </main>
    </>
  );
};
