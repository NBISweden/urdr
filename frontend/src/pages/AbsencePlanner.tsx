import "../index.css";
import React, { useState } from "react";
import { AuthContext } from "../components/AuthProvider";
import { Toast } from "../components/Toast";
import {
  ToastMsg,
  TimeEntry,
  IssueActivityPair,
  FetchedTimeEntry,
  IdName,
  AbsenceInterval,
  Group,
} from "../model";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  reportTime,
  dateFormat,
  getTimeEntries,
  getReportableWorkingDays,
  areConsecutive,
  getWeeksBetweenDates,
  getApiEndpoint,
} from "../utils";
import {
  format as formatDate,
  isBefore,
  isWithinInterval,
  isAfter,
  isSameDay,
  startOfDay,
  parseISO,
  compareAsc,
  endOfWeek,
  startOfWeek,
  isWeekend,
} from "date-fns";
import enGB from "date-fns/locale/en-GB";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import { HeaderUser } from "../components/HeaderUser";
import { LoadingOverlay } from "../components/LoadingOverlay";

import trash from "../icons/trash.svg";
import pencil from "../icons/pencil.svg";

import { useConfirm } from "../components/ConfirmDialogProvider";
import { useSelectDates } from "../components/EditPeriodDialogProvider";
import calender from "../icons/calendar-week-white.svg";

import AbsenceIssuesSelector from "../components/AbsencePlanner/AbsenceIssuesSelector";

export const absenceIssueOptions: { id: number; subject: string }[] = [
  { id: 6992, subject: "Parental leave" },
  { id: 6993, subject: "Sick leave" },
  { id: 6994, subject: "VAB" },
  { id: 6995, subject: "Vacation" },
  { id: 6997, subject: "Other absence" },
];

export const AbsencePlanner = () => {
  const [startDate, setStartDate] = useState<Date>(undefined);
  const [endDate, setEndDate] = useState<Date>(undefined);
  const [toastList, setToastList] = useState<ToastMsg[]>([]);

  const [selectedIssue, setSelectedIssue] = useState<{
    id: number;
    subject: string;
  }>(absenceIssueOptions[0]);
  const extentOfAbsence = 8;

  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<AbsenceInterval[]>([]);
  const [reloadPage, setReloadPage] = useState<boolean>(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const context = React.useContext(AuthContext);
  const confirm: ({}) => any = useConfirm();
  const selectDates: ({}) => any = useSelectDates();

  const today = startOfDay(new Date());
  const absenceFrom: Date = new Date(
    new Date().setMonth(today.getMonth() - 24)
  );
  const absenceTo: Date = new Date(new Date().setMonth(today.getMonth() + 24));

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

  const getReportedEntries = async (start_date: Date, end_date: Date) => {
    let myReportedEntries: FetchedTimeEntry[];
    myReportedEntries = await getTimeEntries(
      undefined,
      start_date,
      end_date,
      context,
      "me"
    );
    return myReportedEntries;
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
    let allRemoved: boolean = true;
    for await (let entryId of entryIds) {
      let entry: TimeEntry = { id: entryId, hours: 0 };
      const result = await reportTime(entry, onErrorRemovingEntries, context);
      if (!result) {
        allRemoved = false;
      }
    }
    return allRemoved;
  };

  const onUpdateAbsenceRanges = async (
    oldEntryIds: number[],
    oldStartDate: Date,
    oldEndDate: Date,
    issueId: number
  ) => {
    const selection: { choice: boolean; startDate: Date; endDate: Date } =
      await selectDates({
        title: "Change your absence period",
        confirmButtonLabel: "Update",
        startDate: oldStartDate,
        endDate: oldEndDate,
      });
    if (!selection.choice) {
      return;
    }
    if (!selection.startDate || !selection.endDate) {
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
      selection.startDate.getTime() &&
      selection.endDate.getTime() &&
      isBefore(selection.endDate, selection.startDate)
    ) {
      setToastList([
        ...toastList,
        {
          type: "warning",
          timeout: 10000,
          message: "Invalid reporting period date ranges",
        },
      ]);
    } else {
      const reportedEntries: FetchedTimeEntry[] = await getReportedEntries(
        startOfWeek(selection.startDate),
        endOfWeek(selection.endDate)
      );
      const timeEntriesExcludingSelectedAbsenceRange = reportedEntries.filter(
        (entry: FetchedTimeEntry) => !oldEntryIds.includes(entry.id)
      );

      if (
        hasReportedMoreThan40HoursPerWeek(
          timeEntriesExcludingSelectedAbsenceRange,
          selection.startDate,
          selection.endDate
        )
      ) {
        setToastList([
          ...toastList,
          {
            type: "warning",
            timeout: 8000,
            message:
              "The maximum amount of absence hours per week (40) has been exceeded in the selected period",
          },
        ]);
      } else {
        const removedAll = await removeTimeEntries(oldEntryIds);
        if (removedAll) {
          const reportable_days = getReportableWorkingDays(
            selection.startDate,
            selection.endDate
          );
          const added = await reportAbsenceTime(
            reportable_days,
            issueId,
            extentOfAbsence
          );
          if (added) {
            setToastList([
              ...toastList,
              {
                type: "info",
                timeout: 8000,
                message: "The absence period was successfully updated",
              },
            ]);
          } else {
            setToastList([
              ...toastList,
              {
                type: "warning",
                timeout: 8000,
                message:
                  "Something went wrong! Your absence plan could not be updated",
              },
            ]);
          }
        }
      }
    }
    setReloadPage(!reloadPage);
  };

  const onRemoveEntriesButton = async (entryIds: number[]) => {
    // Open the dialog first, using the confirm function
    const isConfirmed = await confirm({
      title: "Deleting absence period",
      content: "Do you really want to delete the whole absence period?",
      confirmButtonLabel: "Yes",
    });
    // The confirm function will return a boolean indicating if the user aborts (false) or confirms (true)
    if (!isConfirmed) {
      return;
    } else {
      toggleLoadingPage(true);
      const removed: boolean = await removeTimeEntries(entryIds);
      if (removed) {
        setToastList([
          ...toastList,
          {
            type: "info",
            timeout: 8000,
            message: "Absence period was successfully removed",
          },
        ]);
      }
      toggleLoadingPage(false);
      setReloadPage(!reloadPage);
      return;
    }
  };

  function getAbsenceRanges(entries: FetchedTimeEntry[]): AbsenceInterval[] {
    const sortedEntries = entries.map((entry) => ({
      ...entry,
      spent_on: parseISO(entry.spent_on),
    }));

    sortedEntries.sort((a, b) => compareAsc(a.spent_on, b.spent_on));

    const intervals: AbsenceInterval[] = [];
    const validIssueIds = absenceIssueOptions.map((i) => i.id);

    for (const validIssueId of validIssueIds) {
      let currentInterval: AbsenceInterval | null = null;
      const filteredEntries = sortedEntries.filter(
        (entry) => entry.issue.id === validIssueId && entry.hours === 8
      );
      for (let i = 0; i < filteredEntries.length; i++) {
        const entry = filteredEntries[i];

        if (entry.issue.id === validIssueId) {
          if (currentInterval) {
            const prevDate = filteredEntries[i - 1].spent_on;
            const currentDate = entry.spent_on;

            if (areConsecutive(currentDate, prevDate)) {
              currentInterval.endDate = currentDate;
              currentInterval.entryIds.push(entry.id);
            } else {
              currentInterval.endDate >= today
                ? intervals.push(currentInterval)
                : null;
              currentInterval = {
                startDate: currentDate,
                endDate: currentDate,
                entryIds: [entry.id],
                issueId: entry.issue.id,
                extent: entry.hours,
              };
            }
          } else {
            currentInterval = {
              startDate: entry.spent_on,
              endDate: entry.spent_on,
              entryIds: [entry.id],
              issueId: entry.issue.id,
              extent: entry.hours,
            };
          }
        }
      }
      if (
        currentInterval &&
        intervals.indexOf(currentInterval) === -1 &&
        currentInterval.endDate >= today
      ) {
        intervals.push(currentInterval);
      }
    }
    return intervals;
  }

  const getGroups = async () => {
    toggleLoadingPage(true);
    let groups: Group[] = await getApiEndpoint("/api/groups", context);
    setGroups(groups);
    toggleLoadingPage(false);
  };

  const fetchTimeEntriesForUser = async () => {
    toggleLoadingPage(true);
    let entries = await getAbsenceTimeEntries(absenceFrom, absenceTo, "me");

    const data = getAbsenceRanges(entries);
    const sortedData = data.sort((a, b) =>
      compareAsc(a.startDate, b.startDate)
    );
    setTableData(sortedData);
    toggleLoadingPage(false);
  };

  React.useEffect(() => {
    fetchTimeEntriesForUser();
    getGroups();
  }, [reloadPage]);

  const getAbsenceTimeEntries = async (
    fromDate: Date,
    toDate: Date,
    user_id: string
  ) => {
    const activity: IdName = { id: 19, name: "Absence (Vacation/VAB/Other)" };
    let allAbsenceTimeEntries: FetchedTimeEntry[] = [];

    const absenceTimeEntryPromises = absenceIssueOptions.map(async (issue) => {
      const absence_pair: IssueActivityPair = {
        issue: issue,
        activity: activity,
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
    });
    const absenceTimeEntriesArray = await Promise.all(absenceTimeEntryPromises);

    for (const entries of absenceTimeEntriesArray) {
      allAbsenceTimeEntries.push(...entries);
    }

    return allAbsenceTimeEntries;
  };

  const reportAbsenceTime = async (
    reportable_days: Date[],
    issueId: number,
    extent: number
  ) => {
    let allReported: boolean = true;
    for await (let absence_day of reportable_days) {
      const time_entry: TimeEntry = {
        issue_id: issueId,
        activity_id: 19,
        hours: extent,
        comments: "Reported using the Urdr absence planner",
        spent_on: formatDate(absence_day, dateFormat),
      };
      const saved = await reportTime(time_entry, onAbsenceReportError, context);

      if (!saved) {
        allReported = false;
      }
    }
    return allReported;
  };

  const validateDates = (): boolean => {
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
      isAfter(endDate, new Date(`January 1, ${startDate.getFullYear() + 10}`))
    ) {
      setToastList([
        ...toastList,
        {
          type: "warning",
          timeout: 10000,
          message: "You can't plan absence more than 10 years ahead.",
        },
      ]);
    } else if (
      startDate.getTime() &&
      endDate.getTime() &&
      (isAfter(endDate, startDate) || isSameDay(endDate, startDate))
    ) {
      return true;
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
    return false;
  };

  const reportAbsence = async () => {
    const reportable_days = getReportableWorkingDays(startDate, endDate);
    if (reportable_days.length === 0) {
      setToastList([
        ...toastList,
        {
          type: "warning",
          timeout: 10000,
          message:
            "Choose at least one day without any reported time that is not on a weekend.",
        },
      ]);
      return;
    }
    toggleLoadingPage(true);
    const allReported = await reportAbsenceTime(
      reportable_days,
      selectedIssue.id,
      extentOfAbsence
    );
    toggleLoadingPage(false);
    setStartDate(undefined);
    setEndDate(undefined);
    if (!allReported) {
      setToastList([
        ...toastList,
        {
          type: "warning",
          timeout: 10000,
          message:
            "Something went wrong! Your absence plan could not be submitted",
        },
      ]);
    } else {
      setToastList([
        ...toastList,
        {
          type: "info",
          timeout: 10000,
          message: "Absence plan submitted!",
        },
      ]);
    }
    setReloadPage(!reloadPage);
  };

  const hasReportedMoreThan40HoursPerWeek = (
    reportedEntries: FetchedTimeEntry[],
    startDate: Date,
    endDate: Date
  ): boolean => {
    const weeksToReport: Date[][] = getWeeksBetweenDates(startDate, endDate);
    const numberOfReportedHoursPerWeek: number[] = [];

    weeksToReport.forEach((week: Date[]) => {
      const reportedHours = reportedEntries.reduce(
        (totalHours: number, entry: FetchedTimeEntry) => {
          const entryDate = startOfDay(new Date(entry.spent_on));
          if (
            isWithinInterval(entryDate, {
              start: week[0],
              end: week[week.length - 1],
            })
          ) {
            totalHours += entry.hours;
          }
          return totalHours;
        },
        0
      );
      const numberOfEntriesToReport = week
        .filter((day) =>
          isWithinInterval(day, {
            start: startDate,
            end: endDate,
          })
        )
        .filter((day) => !isWeekend(day)).length;
      const expectedNewAmountOfHoursForWeek =
        reportedHours + extentOfAbsence * numberOfEntriesToReport;

      numberOfReportedHoursPerWeek.push(expectedNewAmountOfHoursForWeek);
    });

    const hasWeekWith40PlusHours = numberOfReportedHoursPerWeek.some(
      (hours) => hours > 40
    );

    return hasWeekWith40PlusHours;
  };

  const onAddAbsenceButton = async () => {
    const areDatesValid: boolean = validateDates();

    if (areDatesValid) {
      const reportedEntries: FetchedTimeEntry[] = await getReportedEntries(
        startOfWeek(startDate),
        endOfWeek(endDate)
      );

      const tooManyHoursToReport = hasReportedMoreThan40HoursPerWeek(
        reportedEntries,
        startDate,
        endDate
      );
      if (!tooManyHoursToReport) {
        await reportAbsence();
      } else {
        setToastList([
          ...toastList,
          {
            type: "warning",
            timeout: 8000,
            message:
              "The maximum amount of hours per week (40) has been exceeded in the selected period",
          },
        ]);
      }
    }
  };

  const onSelectAbsenceIssue = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const issueId = Number(e.target.value);
    const selectedIssue = absenceIssueOptions.find((issue) => {
      return issue.id == issueId;
    });
    setSelectedIssue(selectedIssue);
  };

  const FromDatePicker = () => (
    <DatePicker
      id="fromDate"
      dateFormat={dateFormat}
      selected={startDate ? startDate : undefined}
      onChange={(date: Date) => {
        setStartDate(date);
        document.getElementById("toDate").focus();
      }}
      showWeekNumbers
      showYearDropdown
      todayButton="Today"
      locale={enGB}
      selectsStart
      startDate={startDate}
      endDate={endDate}
      monthsShown={2}
      className="form-control dateInput"
      placeholderText="YYYY-MM-DD"
      strictParsing
    />
  );

  const ToDatePicker = () => (
    <DatePicker
      id="toDate"
      dateFormat={dateFormat}
      selected={endDate ? endDate : undefined}
      onChange={(date: Date) => {
        setEndDate(date);
        document.getElementById("addAbsence").focus();
      }}
      showWeekNumbers
      showYearDropdown
      todayButton="Today"
      locale={enGB}
      selectsEnd
      startDate={startDate}
      endDate={endDate}
      monthsShown={2}
      className="form-control dateInput"
      placeholderText="YYYY-MM-DD"
      strictParsing
    />
  );

  return (
    <>
      {isLoading && (
        <LoadingOverlay>
          <ClimbingBoxLoader
            color="hsl(76deg 55% 53%)"
            loading={isLoading}
            size={17}
            width={4}
            height={6}
            radius={4}
            margin={4}
          />
        </LoadingOverlay>
      )}
      <header className="page-header">
        <h1 className="help-title">Absence reporting</h1>
        <HeaderUser username={context.user ? context.user.login : ""} />
      </header>
      <main className="page-wrapper">
        <h2 className="planned-absence-heading">Planned absence periods</h2>
        <div className="planned-absence">
          <div className="calendar-box">
            {tableData.length > 0 ? (
              <table className="calendar-table">
                <tbody>
                  {/*The empty heading tags make the top border go all the way out*/}
                  <tr>
                    <th>
                      <span className="visually-hidden">Buttons</span>
                    </th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Reason </th>
                  </tr>
                  {tableData.map((element, index) => {
                    return (
                      <tr key={index.toString()}>
                        <td>
                          <button
                            onClick={() => {
                              toggleLoadingPage(true);
                              onUpdateAbsenceRanges(
                                element.entryIds,
                                element.startDate,
                                element.endDate,
                                element.issueId
                              );
                              toggleLoadingPage(false);
                            }}
                            className="table-button"
                          >
                            <img
                              src={pencil}
                              className="table-icon"
                              alt="pencil to edit"
                            />
                          </button>
                          <button
                            onClick={() => {
                              onRemoveEntriesButton(element.entryIds);
                            }}
                            className="table-button"
                          >
                            <img
                              src={trash}
                              className="table-icon"
                              alt="trash icon to delete"
                            />
                          </button>
                        </td>
                        <td>{formatDate(element.startDate, dateFormat)}</td>
                        <td>{formatDate(element.endDate, dateFormat)}</td>
                        <td>
                          {
                            absenceIssueOptions.find(
                              (issue) => issue.id === element.issueId
                            )?.subject
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <>
                <p>You don't have any planned absence periods.</p>
              </>
            )}
          </div>
          <div className="add-absence-box">
            <div className="add-absence-row">
              <p>
                To add an absence period, enter a start and end date. Urdr will
                report eight hours of absence for each work day during that
                period. You can only use this feature, if you haven't reported
                any time during that period yet.
              </p>
            </div>
            <div className="add-absence-row">
              <div className="date-box">
                <label htmlFor="fromDate">Start date&nbsp;</label>
                <FromDatePicker />
                <span className="btn cal-wrapper">
                  <img
                    src={calender}
                    className="calender table-icon"
                    alt="calender"
                  />
                </span>
              </div>
              <div className="date-box">
                <label htmlFor="toDate">End date&nbsp;</label>
                <ToDatePicker />
                <span className="btn cal-wrapper">
                  <img
                    src={calender}
                    className="calender table-icon"
                    alt="calender"
                  />
                </span>
              </div>
            </div>
            <div className="add-absence-row">
              <div>
                <label htmlFor="reson-for-absence">
                  Reason for absence&nbsp;
                </label>
                <AbsenceIssuesSelector
                  onChange={onSelectAbsenceIssue}
                  options={absenceIssueOptions}
                  defaultOption={absenceIssueOptions[0].id}
                />
              </div>
            </div>
            <div className="add-absence">
              <button
                id="addAbsence"
                className="add-absence-button"
                title="Apply selected dates"
                onClick={onAddAbsenceButton}
              >
                Add absence
              </button>
            </div>
          </div>
        </div>
        {toastList.length > 0 && (
          <Toast onCloseToast={handleCloseToast} toastList={toastList} />
        )}
      </main>
    </>
  );
};
