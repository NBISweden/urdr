import.meta.hot;
import React, {
  useState,
  useEffect,
  ElementType,
  MouseEventHandler,
} from "react";
export const PUBLIC_API_URL = process.env.PUBLIC_API_URL;
export const PUBLIC_REDMINE_URL = process.env.PUBLIC_REDMINE_URL;
import { IssueActivityPair, FetchedTimeEntry } from "./model";

import { format as formatDate } from "date-fns";

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
  issueActivityc: IssueActivityPair,
  days: Date[],
  context: any
) => {
  // The ofset param is used to get all time_entries
  // from the api, as the limit per batch is 100
  let offset = 0;
  let gotTotal = false;
  let queryparams = new URLSearchParams({
    issue_id: issueActivityc ? `${issueActivityc.issue.id}` : "",
    activity_id: issueActivityc ? `${issueActivityc.activity.id}` : "",
    from: formatDate(days[0], dateFormat),
    to: formatDate(days[4] ? days[4] : days[1], dateFormat),
    offset: `${offset}`,
    limit: "100",
  });

  let allEntries: FetchedTimeEntry[] = [];

  while (gotTotal === false) {
    let entries: { total_count: number; time_entries: FetchedTimeEntry[] };

    entries = await getApiEndpoint(`/api/time_entries?${queryparams}`, context);
    if (entries) {
      if (entries.total_count > 100 && entries.time_entries.length == 100) {
        offset += 100;
      } else {
        gotTotal = true;
      }
      allEntries.push(...entries.time_entries);
    }
    if (allEntries) return allEntries;
  }
  return null;
};
