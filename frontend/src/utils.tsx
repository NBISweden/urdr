import.meta.hot;
import React, { useState, useEffect } from "react";
import { TimeEntry } from "./model";
export const PUBLIC_API_URL = process.env.PUBLIC_API_URL;
export const PUBLIC_REDMINE_URL = process.env.PUBLIC_REDMINE_URL;
import { IssueActivityPair, FetchedTimeEntry } from "./model";

import {
  compareAsc,
  differenceInDays,
  eachDayOfInterval,
  endOfWeek,
  format as formatDate,
  isBefore,
  isWeekend,
  isWithinInterval,
  startOfWeek,
} from "date-fns";

export let headers = new Headers();
headers.set("Accept", "application/json");
headers.set("Content-Type", "application/json");

export const dateFormat = "yyyy-MM-dd";

export const getApiEndpoint = async (endpoint, context) => {
  if (context.user === null) return null;
  let logout = false;
  let result = await fetch(`${PUBLIC_API_URL}${endpoint}`, {
    method: "GET",
    headers: headers,
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else if (res.status === 401) {
        logout = true;
      } else {
        throw new Error(
          "There was an error accessing the endpoint " + endpoint
        );
      }
    })
    .catch((error) => console.log(error));
  if (logout) context.setUser(null);
  return result;
};

const addDays = (date: Date, days: number) => {
  let result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Return array of all days in the same week as supplied date
export const getFullWeek = (today: Date): Date[] => {
  let fullWeek = [];
  const todayDay = today.getDay(); // Sunday - Saturday : 0 - 6
  let days = [];
  if (todayDay === 0) {
    days = [-6, -5, -4, -3, -2];
  } else if (todayDay === 1) {
    days = [0, 1, 2, 3, 4];
  } else if (todayDay === 2) {
    days = [-1, 0, 1, 2, 3];
  } else if (todayDay === 3) {
    days = [-2, -1, 0, 1, 2];
  } else if (todayDay === 4) {
    days = [-3, -2, -1, 0, 1];
  } else if (todayDay === 5) {
    days = [-4, -3, -2, -1, 0];
  } else if (todayDay === 6) {
    days = [-5, -4, -3, -2, -1];
  }
  days.forEach((day) => {
    fullWeek.push(addDays(today, day));
  });
  return fullWeek;
};

export const getLongCustomDateString = (day: Date) => {
  const getWeekDay = () => {
    let dayString = "";
    const dayNumber = day.getDay();
    switch (dayNumber) {
      case 1:
        dayString = "Mon";
        break;
      case 2:
        dayString = "Tue";
        break;
      case 3:
        dayString = "Wed";
        break;
      case 4:
        dayString = "Thu";
        break;
      case 5:
        dayString = "Fri";
        break;
      default:
        dayString = "";
    }
    return dayString;
  };
  const weekDay = getWeekDay();
  const date = day.getDate();
  const month = day.getMonth() + 1;
  return `${weekDay} ${date}/${month}`;
};

export const getShortCustomDateString = (day: Date) => {
  return `${day.getDate()}/${day.getMonth() + 1}`;
};

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  React.useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    // Cancel the timeout if value changes (also on delay change or unmount)
    // This is how we prevent debounced value from updating if value is changed ...
    // .. within the delay period. Timeout gets cleared and restarted.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export const useViewport = () => {
  const [width, setWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    // Whenever the window is resized, the "width" state veriable will be updated
    const handleWindowResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleWindowResize);

    // Clean-up: Return a function from the effect that removes the event listener...
    // ...when the user leaves the page and the component unmounts.
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  // Return the width so we can use it in our components
  return { width };
};

// Hook to escape a certain DOM element by clicking outside of it or pressing Escape
export const useEscaper = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    // What should happen when clicked outside the element
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    // What should happen when pressed escape
    const handleEscape = (event: any) => {
      if (event.key == "Escape") {
        callback();
      }
    };

    // Bind the event listeners
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      // Unbind the event listeners on clean up
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [ref]);
};

// Retrieve time entries via api
export const getTimeEntries = async (
  issueActivity: IssueActivityPair,
  from_date: Date,
  to_date: Date,
  context: any,
  user_id?: string
) => {
  // The ofset param is used to get all time_entries
  // from the api, as the limit per batch is 100
  let offset: number = 0;
  let gotTotal = false;

  let queryparams = new URLSearchParams({
    issue_id: issueActivity ? `${issueActivity.issue.id}` : "",
    activity_id: issueActivity ? `${issueActivity.activity.id}` : "",
    from: formatDate(from_date, dateFormat),
    to: formatDate(to_date, dateFormat),
    offset: `${offset}`,
    limit: "100",
    user_id: user_id ? user_id : "me",
  });

  if (!issueActivity) {
    queryparams.delete("issue_id");
    queryparams.delete("activity_id");
  }
  let allEntries: FetchedTimeEntry[] = [];

  while (gotTotal === false) {
    let entries: { total_count: number; time_entries: FetchedTimeEntry[] };

    entries = await getApiEndpoint(`/api/time_entries?${queryparams}`, context);
    if (entries) {
      if (entries.total_count > 100 && entries.time_entries.length == 100) {
        offset += 100;
        queryparams.set("offset", offset.toString());
      } else {
        gotTotal = true;
      }
      allEntries.push(...entries.time_entries);
    } else {
      gotTotal = true;
    }
  }
  if (allEntries) return allEntries;

  return null;
};

export const reportTime = async (
  timeEntry: TimeEntry,
  onError: (error: any) => {},
  context: any
) => {
  let logout = false;
  const saved = await fetch(`${PUBLIC_API_URL}/api/time_entries`, {
    body: JSON.stringify({ time_entry: timeEntry }),
    method: "POST",
    headers: headers,
  })
    .then((response) => {
      if (response.ok) {
        return true;
      } else if (response.status === 401) {
        logout = true;
      } else if (response.status === 422) {
        throw new Error(
          `Invalid issue-activity combination for (${timeEntry.issue_id}) or invalid amount of time entered`
        );
      } else {
        throw new Error(`Time report on issue ${timeEntry.issue_id} failed.`);
      }
    })
    .catch((error) => {
      onError(error);
    });
  if (logout) context.setUser(null);
  return saved;
};

// Filter for weekdays. Return only Monday through Friday.
export const isWeekday = (dt: Date) => {
  const day = dt.getDay();
  return day !== 0 && day !== 6;
};

export function areConsecutive(currentDate: Date, prevDate: Date): boolean {
  const daysDifference = differenceInDays(currentDate, prevDate);
  const weekendDifferenceDays: number = eachDayOfInterval({
    start: prevDate,
    end: currentDate,
  }).filter((date) => isWeekend(date)).length;
  const areConsecutiveExceptWeekend =
    daysDifference === 3 && weekendDifferenceDays === 2;
  const nextDate = addDays(prevDate, 1);
  const areDirectlyConsecutive =
    compareAsc(nextDate, currentDate) === 0 ||
    compareAsc(nextDate, currentDate) === 1;
  return areConsecutiveExceptWeekend || areDirectlyConsecutive;
}

export const getWeeksBetweenDates = (
  startDate: Date,
  endDate: Date
): Date[][] => {
  const weeks: Date[][] = [];

  let currentWeekStart = startOfWeek(startDate);

  while (isBefore(currentWeekStart, endDate)) {
    const currentWeekEnd = endOfWeek(currentWeekStart);
    const daysOfWeek = eachDayOfInterval({
      start: currentWeekStart,
      end: currentWeekEnd,
    });

    if (daysOfWeek.length > 0) {
      weeks.push(daysOfWeek);
    }

    currentWeekStart = startOfWeek(new Date(currentWeekEnd.getTime() + 1));
  }

  return weeks;
};

export const getReportableWorkingDays = (
  frDate: Date,
  toDate: Date
): Date[] => {
  const dates_interval: Interval = { start: frDate, end: toDate };
  const all_days = eachDayOfInterval(dates_interval);
  let reportable_days = all_days.slice();
  reportable_days = reportable_days.filter((date) => isWeekday(date));
  return reportable_days;
};
