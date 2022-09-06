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
  getUsersInGroups,
  getGroups,
} from "../utils";
import {
  eachDayOfInterval,
  Interval,
  format as formatDate,
  addDays,
} from "date-fns";
import LoadingOverlay from "react-loading-overlay-ts";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import { HeaderUser } from "../components/HeaderUser";
import { Chart } from "react-google-charts";

export const VacationPlanner = () => {
  const [startDate, setStartDate] = useState<Date>(undefined);
  const [endDate, setEndDate] = useState<Date>(undefined);
  const [toastList, setToastList] = useState<ToastMsg[]>([]);
  const [vacationRows, setVacationRows] = useState<[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<{
    id: number;
    name: string;
  }>(undefined);
  const [redmineGroups, setRedmineGroups] = useState<[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const timelineOptions = {
    hAxis: {
      minValue: new Date(2021, 11, 20),
      maxValue: new Date(2021, 12, 30),
    },
    avoidOverlappingGridLines: false,
    colors: ["#BFD6D8"],
    // This line makes the entire category's tooltip active.
    focusTarget: "category",
    // Use an HTML tooltip.
    tooltip: { isHtml: true },
    timeline: {
      showRowLabels: true,
      rowLabelStyle: {
        fontName: "Lato",
        fontSize: 17,
      },
      barLabelStyle: {
        fontName: "Lato",
        fontSize: 16,
      },
    },
  };

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

  const getVacationRanges = (entries: FetchedTimeEntry[]) => {
    const vacationDates: {
      dateRanges: { entryIds: number[]; dates: Date[] }[];
      userName: string;
    } = findConsecutiveDates(entries);
    const vacationRanges: {
      startDate: Date;
      endDate: Date;
      userName: string;
      entryIds: number[];
    }[] = vacationDates.dateRanges.map(
      (range: { entryIds: number[]; dates: Date[] }) => {
        if (range.dates.length === 1) {
          let date = range.dates[range.dates.length - 1];
          return {
            startDate: date,
            endDate: date,
            userName: vacationDates.userName,
            entryIds: range.entryIds,
          };
        } else if (range.dates.length > 1) {
          let fromDate = range.dates[range.dates.length - 1];
          let toDate = range.dates[0];
          return {
            startDate: fromDate,
            endDate: toDate,
            userName: vacationDates.userName,
            entryIds: range.entryIds,
          };
        }
      }
    );
    return vacationRanges;
  };

  const findConsecutiveDates = (entries: FetchedTimeEntry[]) => {
    let rangesIndex: number = 0;
    let userName: string | IdName = "";
    const dateRanges: { entryIds: number[]; dates: Date[] }[] = entries.reduce(
      (
        entryRanges: { entryIds: number[]; dates: Date[] }[],
        entry: FetchedTimeEntry,
        index,
        fetchedEntries: FetchedTimeEntry[]
      ) => {
        // Find out the last date we last appended to a range array
        userName = entry.user.name ? entry.user.name : entry.user;
        let entryId: number = entry.id;

        let lastInRange: Date = entryRanges[rangesIndex]
          ? entryRanges[rangesIndex].dates.slice(-1).pop()
          : undefined;
        // Use the last appended date as toDate or first next iteration value (first)
        const toDate = lastInRange ? lastInRange : new Date(entry.spent_on);
        // Use next element in fetchedEntries as fromDate, and if it does not exist, use toDate
        const fromDate = fetchedEntries[index + 1]
          ? new Date(fetchedEntries[index + 1].spent_on)
          : toDate;

        // Initialise the entryRanges with the first entry date
        if (index === 0) {
          entryRanges.push({ entryIds: [entryId], dates: [toDate] });
        }
        // If it's friday, the next reportable day is 3 days away, otherwise 1 day
        let daysToNextReportableDay: number = fromDate.getDay() === 5 ? 3 : 1;
        // If dates are consecutive ...
        if (addDays(fromDate, daysToNextReportableDay) - toDate === 0) {
          // And the date is not aalready present
          if (
            !entryRanges
              .map((obj: { entryIds: number[]; dates: Date[] }) => {
                return obj.dates;
              })
              .flat()
              .find((date: Date) => date.getTime() === fromDate.getTime())
          ) {
            // Add date to entry ranges
            entryRanges[rangesIndex].dates.push(fromDate);
            entryRanges[rangesIndex].entryIds.push(entryId);
          }
        } else {
          // Otherwise add a new range array, if the date does not already exist
          if (
            !entryRanges
              .map((issueDates: { entryIds: number[]; dates: Date[] }) => {
                return issueDates.dates;
              })
              .flat()
              .find((date: Date) => date.getTime() === fromDate.getTime())
          ) {
            entryRanges.push({ entryIds: [entryId], dates: [fromDate] });

            rangesIndex++;
          }
        }

        return entryRanges;
      },
      []
    );
    return { dateRanges: dateRanges, userName: userName };
  };

  React.useEffect(() => {
    toggleLoadingPage(true);
    const fetchTimeEntriesFromGroups = async () => {
      const users: { group_id: number; users: number[] } =
        await getUsersInGroups(context);
      const redmine_groups: [{ id: number; name: string }] = await getGroups(
        context
      );

      setRedmineGroups(redmine_groups);

      let groupId: number = selectedGroup
        ? selectedGroup.id
        : redmine_groups[0].id;

      let all_group_users: number[] = users[groupId];
      let group_users: number[] = [...new Set(all_group_users)];

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
      let sliced_users = group_users.slice(-12);

      let vacationRows: [] = [];
      vacationRows.push([
        { type: "string", id: "User" },
        { type: "string", role: "tooltip", p: { html: true } },
        { type: "date", id: "Start" },
        { type: "date", id: "End" },
      ]);

      for await (let user of sliced_users) {
        let entries = await getVacationTimeEntries(
          new Date(2021, 10, 20),
          new Date(2022, 2, 30),
          user.toString()
        );
        const vacationRanges: {
          startDate: Date;
          endDate: Date;
          userName: string;
        }[] = getVacationRanges(entries);

        vacationRanges.map(
          (range: { startDate: Date; endDate: Date; userName: string }) => {
            range.group = groupId;
          }
        );

        vacationRanges.map(
          (range: {
            startDate: Date;
            endDate: Date;
            userName: string;
            group: string;
          }) => {
            vacationRows.push([
              range.userName,
              "test",
              range.startDate,
              range.endDate,
            ]);
          }
        );
      }
      toggleLoadingPage(false);

      setVacationRows(vacationRows);
    };
    fetchTimeEntriesFromGroups();
  }, [selectedGroup]);

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
            type: "warning",
            timeout: 10000,
            message: "Time has already been reported on this period",
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
        filterDate={isWeekday}
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
        filterDate={isWeekday}
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
        <h4>Reported vacation</h4>
        <div className="group-select-wrapper">
          <span> Filter by group: </span>
          <select
            className="col-3 footer-field"
            name="activity"
            id="select-activity"
            onChange={(e) => {
              const groupId = e.target.value;
              const group = redmineGroups.find((group) => {
                return group.id == groupId;
              });
              setSelectedGroup(group);
            }}
          >
            {redmineGroups &&
              redmineGroups.map((group) => {
                return (
                  <option value={group.id} key={group.id}>
                    {group.name}
                  </option>
                );
              })}
          </select>
        </div>
        <div>
          {vacationRows.length > 1 ? (
            <Chart
              chartType="Timeline"
              data={vacationRows}
              width="100%"
              height="400px"
              options={timelineOptions}
            />
          ) : (
            <p>No time entries were found</p>
          )}
        </div>
        {toastList.length > 0 && (
          <Toast onCloseToast={handleCloseToast} toastList={toastList} />
        )}
      </main>
    </>
  );
};
