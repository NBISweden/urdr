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
  Interval,
  format as formatDate,
  getISOWeekYear,
} from "date-fns";
import LoadingOverlay from "react-loading-overlay-ts";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import { TimeTravel } from "../components/TimeTravel";
import { HeaderUser } from "../components/HeaderUser";

export const VacationPlanner = () => {
  const [startDate, setStartDate] = useState<Date>(undefined);
  const [endDate, setEndDate] = useState<Date>(undefined);
  const [toastList, setToastList] = useState<ToastMsg[]>([]);
  const [vacationEntries, setVacationEntries] = useState<FetchedTimeEntry[]>(
    []
  );
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

  const hasAlreadyReported = async (start_date: Date, end_date: Date) => {
    let myReportedEntries: FetchedTimeEntry[];
    myReportedEntries = await getTimeEntries(
      undefined,
      start_date,
      end_date,
      context,
      "me"
    );
    return myReportedEntries.length;
  };

  React.useEffect(() => {
    toggleLoadingPage(true);
    const fetchTimeEntriesFromGroups = async () => {
      const users: { group_id: number; users: number[] } =
        await getUsersInGroups(context);
      const redmine_groups: [{ id: number; name: string }] = await getGroups(
        context
      );
      const obj_groups = Object.fromEntries(
        redmine_groups.map((item) => [item["id"], item["name"]])
      );

      setRedmineGroups(obj_groups);

      // Take the first group
      let first_group: string = Object.keys(users)[0];
      let group_users = users[parseInt(first_group)];
      // Make users unique TODO

      if (!group_users) {
        toggleLoadingPage(false);
        setToastList([
          ...toastList,
          {
            type: "warning",
            timeout: 10000,
            message:
              "Your user does not belong to any group. Please contact our administrators",
          },
        ]);
        return;
      }

      // So that loading times are shorter, we only take one
      let sliced_users = group_users.slice(-1);

      const vacation_entries: FetchedTimeEntry[] = [];
      for await (let group of sliced_users) {
        let entries = await getVacationTimeEntries(
          new Date(2022),
          new Date(2023),
          group.toString()
        );
        vacation_entries.push(...entries);
      }
      toggleLoadingPage(false);

      setVacationEntries([...vacationEntries, ...vacation_entries.slice(-1)]);
    };
    fetchTimeEntriesFromGroups();
  }, []);

  const getVacationTimeEntries = async (
    fromDate: Date,
    toDate: Date,
    user_id: string
  ) => {
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

    const vacationTimeEntries = await getTimeEntries(
      vacation_pair,
      fromDate,
      toDate,
      context,
      user_id
    );

    return vacationTimeEntries;
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
      endDate >= startDate
    ) {
      let reportedEntries: number = await hasAlreadyReported(
        startDate,
        endDate
      );
      if (reportedEntries > 0) {
        setToastList([
          ...toastList,
          {
            type: "info",
            timeout: 10000,
            message: "Vacation has already been reported on this period.",
          },
        ]);
        return;
      }
      const dates_interval: Interval = { start: startDate, end: endDate };
      const all_days = eachDayOfInterval(dates_interval);
      let reportable_days = all_days.slice();
      reportable_days = reportable_days.filter((date) => isWeekday(date));
      toggleLoadingPage(true);
      await reportVacationTime(reportable_days);
      toggleLoadingPage(false);
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
      <header className="page-header">
        <h1 className="help-title">Vacation reporting</h1>
        <HeaderUser username={context.user ? context.user.login : ""} />
      </header>
      <main className="page-wrapper">
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
        <h3>Time entries</h3>
        <div>{JSON.stringify(Object.values(redmineGroups))}</div>
        <div>{JSON.stringify(vacationEntries)}</div>
        {toastList.length > 0 && (
          <Toast onCloseToast={handleCloseToast} toastList={toastList} />
        )}
      </main>
    </>
  );
};
