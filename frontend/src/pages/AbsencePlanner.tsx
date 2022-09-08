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
import { eachDayOfInterval, Interval, format as formatDate } from "date-fns";
import LoadingOverlay from "react-loading-overlay-ts";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import { HeaderUser } from "../components/HeaderUser";
import { Chart } from "react-google-charts";
import trash from "../icons/trash.svg";
import pencil from "../icons/pencil.svg";

export const AbsencePlanner = () => {
  const [startDate, setStartDate] = useState<Date>(undefined);
  const [endDate, setEndDate] = useState<Date>(undefined);
  const [toastList, setToastList] = useState<ToastMsg[]>([]);
  const [absenceRows, setAbsenceRows] = useState<[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<{
    id: number;
    name: string;
  }>(undefined);
  const [redmineGroups, setRedmineGroups] = useState<[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<
    { startDate: Date; endDate: Date; userName: string; entryIds: number[] }[]
  >([]);
  const absenceFrom: Date = getAbsenceFrom();
  const absenceTo: Date = getAbsenceTo();
  const [reloadPage, setReloadPage] = useState<boolean>(false);

  function getAbsenceFrom() {
    let today = new Date();

    return new Date(today.setMonth(today.getMonth() - 1));
  }

  function getAbsenceTo() {
    let today = new Date();

    return new Date(today.setMonth(today.getMonth() + 12));
  }

  const timelineOptions = {
    hAxis: {
      minValue: absenceFrom,
      maxValue: absenceTo,
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

  const onAbsenceReportError = (error: any) => {
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

  const onErrorRemovingEntries = (error: any) => {
    setToastList([
      ...toastList,
      {
        type: "warning",
        timeout: 5000,
        message: "Error deleting entries. " + error.message,
      },
    ]);
    return false;
  };

  const removeTimeEntries = async (entryIds: number[]) => {
    let removed = undefined;
    for await (let entryId of entryIds) {
      let entry: TimeEntry = { id: entryId, hours: 0 };
      removed = await reportTime(entry, onErrorRemovingEntries, context);
    }
    if (removed) {
      setToastList([
        ...toastList,
        {
          type: "info",
          timeout: 8000,
          message: "Absence period was successfully removed",
        },
      ]);
      setReloadPage(!reloadPage);
    }
  };

  const onRemoveEntriesButton = async (entryIds: number[]) => {
    toggleLoadingPage(true);
    await removeTimeEntries(entryIds);
    toggleLoadingPage(false);
  };

  const getAbsenceRanges = (entries: FetchedTimeEntry[]) => {
    const absenceDates: {
      dateRanges: { entryIds: number[]; dates: Date[] }[];
      userName: string;
    } = findConsecutiveDates(entries);
    const absenceRanges: {
      startDate: Date;
      endDate: Date;
      userName: string;
      entryIds: number[];
    }[] = absenceDates.dateRanges.map(
      (range: { entryIds: number[]; dates: Date[] }) => {
        if (range.dates.length === 1) {
          let date = range.dates[range.dates.length - 1];
          return {
            startDate: date,
            endDate: date,
            userName: absenceDates.userName,
            entryIds: range.entryIds,
          };
        } else if (range.dates.length > 1) {
          let fromDate = range.dates[range.dates.length - 1];
          let toDate = range.dates[0];
          return {
            startDate: fromDate,
            endDate: toDate,
            userName: absenceDates.userName,
            entryIds: range.entryIds,
          };
        }
      }
    );
    return absenceRanges;
  };

  const entryExists = (
    entryRanges: { entryIds: number[]; dates: Date[] }[],
    entryId: number
  ) => {
    return !entryRanges
      .map((obj: { entryIds: number[]; dates: Date[] }) => {
        return obj.entryIds;
      })
      .flat()
      .includes(entryId);
  };

  const dateExists = (
    entryRanges: { entryIds: number[]; dates: Date[] }[],
    targetDate: Date
  ) => {
    return entryRanges
      .map((obj: { entryIds: number[]; dates: Date[] }) => {
        return obj.dates;
      })
      .flat()
      .find((date: Date) => date.getTime() === targetDate.getTime());
  };

  const areDatesConsecutive = (fDate: Date, tDate: Date) => {
    let daysToNextReportableDay: number = fDate.getDay() === 5 ? 3 : 1;
    return (
      fDate.getTime() + 86400000 * daysToNextReportableDay - tDate.getTime() ===
      0
    );
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

        let lastInRange: Date = entryRanges[rangesIndex]
          ? entryRanges[rangesIndex].dates.slice(-1).pop()
          : undefined;
        // Use the last appended date as toDate or first next iteration value (first)
        const toDate = lastInRange ? lastInRange : new Date(entry.spent_on);
        // Use next element in fetchedEntries as fromDate, and if it does not exist, use toDate
        const fromDate = fetchedEntries[index + 1]
          ? new Date(fetchedEntries[index + 1].spent_on)
          : toDate;

        let toEntryId: number = entry.id;
        let fromEntryId: number = fetchedEntries[index + 1]
          ? fetchedEntries[index + 1].id
          : toEntryId;

        // Initialise the entryRanges with the first entry date
        if (index === 0) {
          if (fetchedEntries.length > 1) {
            if (areDatesConsecutive(fromDate, toDate)) {
              entryRanges.push({
                entryIds: [toEntryId, fromEntryId],
                dates: [toDate, fromDate],
              });
            } else {
              entryRanges.push({ entryIds: [fromEntryId], dates: [fromDate] });
              entryRanges.push({ entryIds: [toEntryId], dates: [toDate] });
              rangesIndex++;
            }
          } else {
            entryRanges.push({ entryIds: [toEntryId], dates: [toDate] });
          }
        } else {
          // If it's friday, the next reportable day is 3 days away, otherwise 1 day
          // If dates are consecutive ...

          if (areDatesConsecutive(fromDate, toDate)) {
            // And the date is not already present
            if (!dateExists(entryRanges, fromDate)) {
              entryRanges[rangesIndex].dates.push(fromDate);
              entryRanges[rangesIndex].entryIds.push(fromEntryId);
            } else if (dateExists(entryRanges, fromDate)) {
              if (!entryExists(entryRanges, fromEntryId)) {
                entryRanges[rangesIndex].entryIds.push(fromEntryId);
              }
            }
            // Add date to entry ranges
          } else {
            // Otherwise add a new range array, if the date does not already exist
            if (!dateExists(entryRanges, fromDate)) {
              entryRanges.push({ entryIds: [fromEntryId], dates: [fromDate] });
            }
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
      let sliced_users = group_users.slice(-1);

      let absenceRows: [] = [];
      absenceRows.push([
        { type: "string", id: "User" },
        { type: "string", role: "tooltip", p: { html: true } },
        { type: "date", id: "Start" },
        { type: "date", id: "End" },
      ]);

      for await (let user of sliced_users) {
        let entries = await getAbsenceTimeEntries(
          absenceFrom,
          absenceTo,
          user.toString()
        );
        const absenceRanges: {
          startDate: Date;
          endDate: Date;
          userName: string;
          entryIds: number[];
        }[] = getAbsenceRanges(entries);

        absenceRanges.map(
          (range: { startDate: Date; endDate: Date; userName: string }) => {
            range.group = groupId;
          }
        );

        absenceRanges.map(
          (range: {
            startDate: Date;
            endDate: Date;
            userName: string;
            group: string;
          }) => {
            absenceRows.push([
              range.userName,
              "test",
              range.startDate,
              range.endDate,
            ]);
          }
        );
      }

      setAbsenceRows(absenceRows);
    };

    const fetchTimeEntriesForUser = async () => {
      toggleLoadingPage(true);
      let entries = await getAbsenceTimeEntries(absenceFrom, absenceTo, "me");

      const data = getAbsenceRanges(entries);
      setTableData(data);
      toggleLoadingPage(false);
    };
    fetchTimeEntriesForUser();
    //fetchTimeEntriesFromGroups();
  }, [selectedGroup, reloadPage]);

  const getAbsenceTimeEntries = async (
    fromDate: Date,
    toDate: Date,
    user_id: string
  ) => {
    const issue: Issue = {
      id: 3499,
      subject: "NBIS General - Absence (Vacation/VAB/Other)",
    };
    const id_name: IdName = { id: 19, name: "Absence (Vacation/VAB/Other)" };
    const absence_pair: IssueActivityPair = {
      issue: issue,
      activity: id_name,
      custom_name: "",
      is_hidden: false,
    };

    const absenceTimeEntries = await getTimeEntries(
      absence_pair,
      fromDate,
      toDate,
      context,
      user_id
    );

    return absenceTimeEntries;
  };

  const reportAbsenceTime = async (reportable_days: Date[]) => {
    for await (let absence_day of reportable_days) {
      const time_entry: TimeEntry = {
        issue_id: 3499,
        activity_id: 19,
        hours: 8,
        comments: "Reported using the Urdr absence planner",
        spent_on: formatDate(absence_day, dateFormat),
      };
      const saved = await reportTime(time_entry, onAbsenceReportError, context);

      if (!saved) {
        setToastList([
          ...toastList,
          {
            type: "warning",
            timeout: 5000,
            message:
              "Something went wrong! Your absence plan could not be submitted",
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
      await reportAbsenceTime(reportable_days);
      toggleLoadingPage(false);
      setStartDate(undefined);
      setEndDate(undefined);
      setToastList([
        ...toastList,
        {
          type: "info",
          timeout: 10000,
          message: "Absence plan submitted!",
        },
      ]);
      setReloadPage(!reloadPage);
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

  //The empty heading tags make the top border go all the way out
  const getAbsenceHeadings = () => (
    <tr>
      <th>Start date</th>
      <th>End date</th>
      <th></th>
      <th></th>
    </tr>
  );
  const getAbsenceTable = tableData.map((element, index) => {
    return (
      <tr key={index.toString()}>
        <td>{formatDate(element.startDate, dateFormat)}</td>
        <td>{formatDate(element.endDate, dateFormat)}</td>
        <td>
          <img src={pencil} className="pencil-icon" alt="pencil to edit" />
        </td>
        <td>
          <button
            onClick={() => {
              onRemoveEntriesButton(element.entryIds);
            }}
            className="trash-button"
          >
            <img
              src={trash}
              className="trash-icon"
              alt="trash icon to delete"
            />
          </button>
        </td>
      </tr>
    );
  });

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
        <h1 className="help-title">Absence reporting</h1>
        <HeaderUser username={context.user ? context.user.login : ""} />
      </header>
      <main className="page-wrapper">
        <div className="absence-plan-dates-wrapper">
          <div className="absence-plan-container">
            <label
              htmlFor="absence-plan-picker"
              className="absence-plan-picker-label"
            >
              From:
            </label>
            <FromDatePicker />
          </div>
          <div className="absence-plan-container">
            <label
              htmlFor="absence-plan-picker"
              className="absence-plan-picker-label"
            >
              To:
            </label>
            <ToDatePicker />
          </div>
          <div className="absence-plan-container">
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
        {tableData.length > 0 ? (
          <div className="table-wrapper">
            <table>
              {getAbsenceHeadings()}
              {getAbsenceTable}
            </table>
          </div>
        ) : (
          <> </>
        )}
        <h4>Reported absence</h4>
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
          {absenceRows.length > 1 ? (
            <Chart
              chartType="Timeline"
              data={absenceRows}
              width="100%"
              height="400px"
              options={timelineOptions}
            />
          ) : (
            <p>No absence entries were found</p>
          )}
        </div>
        {toastList.length > 0 && (
          <Toast onCloseToast={handleCloseToast} toastList={toastList} />
        )}
      </main>
    </>
  );
};
