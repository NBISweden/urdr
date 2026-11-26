import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { useNavigate, useParams } from "react-router-dom";
import {
  startOfMonth,
  endOfMonth,
  format as formatDate,
  getISOWeek,
  getISOWeekYear,
  isMonday,
  isSameMonth,
} from "date-fns";
import { ClimbingBoxLoader } from "react-spinners";
import { HeaderUser } from "../components/HeaderUser";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { MonthPicker } from "../components/MonthPicker";
import { Toast } from "../components/Toast";
import { FetchedTimeEntry, Issue, ToastMsg } from "../model";
import {
  dateFormat,
  getApiEndpoint,
  getReportableWorkingDays,
  getTimeEntries,
  groupEntries,
} from "../utils";

// One line of the grid: an issue, and the hours spent on it per day.
type IssueRow = {
  issueId: number;
  subject: string;
  hoursByDate: { [date: string]: number };
  total: number;
};

// Redmine caps a query at 100 issues, so ask for the subjects in batches.
const issueBatchSize = 100;

const monthFromParams = (params: { year?: string; month?: string }) => {
  const yearnum = Number(params.year);
  const monthnum = Number(params.month);
  if (!isNaN(yearnum) && yearnum > 0 && monthnum >= 1 && monthnum <= 12) {
    return new Date(yearnum, monthnum - 1, 1);
  }
  return null;
};

const fetchIssueSubjects = async (
  issueIds: number[],
  context: any
): Promise<{ [issueId: number]: string }> => {
  const subjects: { [issueId: number]: string } = {};
  for (let i = 0; i < issueIds.length; i += issueBatchSize) {
    const batch = issueIds.slice(i, i + issueBatchSize);
    const response = await getApiEndpoint(
      `/api/issues?issue_id=${batch.join(
        ","
      )}&status_id=*&limit=${issueBatchSize}`,
      context
    );
    // getApiEndpoint swallows errors and returns undefined.
    if (!response || !response.issues) continue;
    response.issues.map((issue: Issue) => {
      subjects[issue.id] = issue.subject;
    });
  }
  return subjects;
};

export const EuReport = () => {
  const context = useAuth();
  const urlparams = useParams();
  const navigate = useNavigate();
  const [month, setMonth] = useState(
    () => monthFromParams(urlparams) ?? startOfMonth(new Date())
  );
  const [rows, setRows] = useState<IssueRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null);
  const [toastList, setToastList] = useState<ToastMsg[]>([]);

  const days = getReportableWorkingDays(month, endOfMonth(month));

  // Follow the URL, so back/forward navigation changes the month too.
  useEffect(() => {
    const urlMonth = monthFromParams(urlparams);
    if (urlMonth === null) {
      addToast({
        type: "warning",
        timeout: 10000,
        message: "Invalid year or month in URL. Reverting to this month.",
      });
    } else if (!isSameMonth(urlMonth, month)) {
      setMonth(urlMonth);
    }
  }, [urlparams.year, urlparams.month]);

  useEffect(() => {
    let didCancel = false;

    const loadMonth = async () => {
      setIsLoading(true);
      const entries: FetchedTimeEntry[] = await getTimeEntries(
        undefined,
        month,
        endOfMonth(month),
        context,
        "me"
      );
      if (didCancel) return;
      // buildRows awaits the issue subjects, so the month may have
      // changed again by the time it resolves.
      const builtRows = await buildRows(entries ?? []);
      if (didCancel) return;
      setRows(builtRows);
      setIsLoading(false);
    };

    loadMonth();
    return () => {
      didCancel = true;
    };
  }, [month]);

  const buildRows = async (entries: FetchedTimeEntry[]) => {
    const shownDates = days.map((day) => formatDate(day, dateFormat));

    // Hours outside the weekday columns would otherwise vanish silently.
    const hidden = entries.filter(
      (entry) => !shownDates.includes(entry.spent_on)
    );
    if (hidden.length > 0) {
      addToast({
        type: "warning",
        timeout: 10000,
        message: `${hidden.length} entries fall on weekends and are not shown.`,
      });
    }

    const shown = entries.filter((entry) =>
      shownDates.includes(entry.spent_on)
    );
    const byIssue = groupEntries(shown, (entry) => `${entry.issue.id}`);
    const issueIds = Object.keys(byIssue).map(Number);
    // A time entry carries only the issue id, never its subject.
    const subjects = await fetchIssueSubjects(issueIds, context);

    return issueIds
      .map((issueId) => {
        const hoursByDate: { [date: string]: number } = {};
        let total = 0;
        byIssue[issueId].map((entry) => {
          hoursByDate[entry.spent_on] =
            (hoursByDate[entry.spent_on] ?? 0) + entry.hours;
          total += entry.hours;
        });
        return {
          issueId: issueId,
          subject: subjects[issueId] ?? "",
          hoursByDate: hoursByDate,
          total: total,
        };
      })
      .sort((a, b) => b.total - a.total);
  };

  // Weekends have no column of their own, so a Monday opens a new week.
  const dayCellClass = (day: Date, index: number) => {
    return index > 0 && isMonday(day)
      ? "eu-report-day-cell eu-report-week-start"
      : "eu-report-day-cell";
  };

  // Reported hours are decimal, so summing them accumulates float
  // noise: 0.1 + 0.2 would otherwise render as 0.30000000000000004 and
  // stretch the column to fit it.
  const formatHours = (hours: number) => {
    return hours ? `${Math.round(hours * 100) / 100}` : "";
  };

  const weekKey = (day: Date) => {
    return `${getISOWeekYear(day)}-${getISOWeek(day)}`;
  };

  // Every day of a week leads to the same place, so the whole week
  // highlights together rather than the single day under the pointer.
  const dayHeaderClass = (day: Date, index: number) => {
    return hoveredWeek === weekKey(day)
      ? `${dayCellClass(day, index)} eu-report-week-hovered`
      : dayCellClass(day, index);
  };

  const getColumnTotal = (date: string) => {
    return rows.reduce((sum, row) => sum + (row.hoursByDate[date] ?? 0), 0);
  };

  const getGrandTotal = () => {
    return rows.reduce((sum, row) => sum + row.total, 0);
  };

  const addToast = (toast: ToastMsg) => {
    setToastList((current) => [...current, toast]);
  };

  const handleMonthChange = (newDate: Date) => {
    if (isSameMonth(newDate, month)) return;
    const newMonth = startOfMonth(newDate);
    setMonth(newMonth);
    navigate(`/eu-report/${newMonth.getFullYear()}/${newMonth.getMonth() + 1}`);
  };

  // The weekly report is where hours actually get edited, so a date is a
  // way in to the week it belongs to.
  const handleDayClick = (day: Date) => {
    navigate(`/report/${getISOWeekYear(day)}/${getISOWeek(day)}`);
  };

  const handleCloseToast = (index: number) => {
    const newToastList = [...toastList];
    newToastList.splice(index, 1);
    setToastList(newToastList);
  };

  return (
    <>
      {isLoading && (
        <LoadingOverlay>
          <ClimbingBoxLoader color="hsl(76deg 55% 53%)" loading={isLoading} />
        </LoadingOverlay>
      )}
      <header className="page-header">
        <h1 className="eu-report-title">EU report</h1>
        <MonthPicker startDate={month} onMonthDateChange={handleMonthChange} />
        <HeaderUser username={context.user ? context.user.login : ""} />
      </header>
      <main className="page-wrapper">
        {!isLoading && rows.length === 0 && (
          <p className="eu-report-info">
            No time reported in {formatDate(month, "MMMM yyyy")}.
          </p>
        )}
        {rows.length > 0 && (
          <div className="eu-report-scroll">
            <table className="eu-report-table">
              <thead>
                <tr>
                  <th className="eu-report-issue-cell">Issue</th>
                  {days.map((day, index) => (
                    <th
                      key={day.getTime()}
                      className={dayHeaderClass(day, index)}
                    >
                      <button
                        type="button"
                        className="eu-report-day-button"
                        title={`Report time for week ${getISOWeek(day)}`}
                        onClick={() => handleDayClick(day)}
                        onMouseEnter={() => setHoveredWeek(weekKey(day))}
                        onMouseLeave={() => setHoveredWeek(null)}
                        onFocus={() => setHoveredWeek(weekKey(day))}
                        onBlur={() => setHoveredWeek(null)}
                      >
                        {formatDate(day, "d")}
                      </button>
                    </th>
                  ))}
                  <th className="eu-report-total-cell">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.issueId}>
                    <th className="eu-report-issue-cell">
                      #{row.issueId} {row.subject}
                    </th>
                    {days.map((day, index) => {
                      const date = formatDate(day, dateFormat);
                      return (
                        <td key={date} className={dayCellClass(day, index)}>
                          {formatHours(row.hoursByDate[date] ?? 0)}
                        </td>
                      );
                    })}
                    <td className="eu-report-total-cell">
                      {formatHours(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th className="eu-report-issue-cell">Total</th>
                  {days.map((day, index) => {
                    const date = formatDate(day, dateFormat);
                    return (
                      <td key={date} className={dayCellClass(day, index)}>
                        {formatHours(getColumnTotal(date))}
                      </td>
                    );
                  })}
                  <td className="eu-report-total-cell">
                    {formatHours(getGrandTotal())}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {toastList.length > 0 && (
          <Toast onCloseToast={handleCloseToast} toastList={toastList} />
        )}
      </main>
    </>
  );
};
