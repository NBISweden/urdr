import.meta.hot;
import React, { useState } from "react";
import { IssueActivityPair } from "./model";
import { AuthContext } from "./components/AuthProvider";

export const { SNOWPACK_PUBLIC_API_URL } = __SNOWPACK_ENV__;

export let headers = new Headers();
headers.set("Accept", "application/json");
headers.set("Content-Type", "application/json");

export const getApiEndpoint = async (endpoint) => {
  let result = await fetch(`${SNOWPACK_PUBLIC_API_URL}${endpoint}`, {
    method: "GET",
    headers: headers,
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else if (res.status === 401) {
        // Redirect to login page
        window.location.href = "/login";
      } else {
        throw new Error(
          "There was an error accessing the endpoint " + endpoint
        );
      }
    })
    .catch((error) => console.log(error));
  return result;
};

const addDays = (date: Date, days: number) => {
  let result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
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

// Removes an IssueActivityPair object from an array of these objects.
// Returns the shortened array.
export const removeIssueActivityPair = (
  pairs: IssueActivityPair[],
  item: IssueActivityPair
): IssueActivityPair[] => {
  const removed = pairs.find(
    (pair) =>
      pair.activity.id === item.activity.id && pair.issue.id === item.issue.id
  );
  const index = pairs.indexOf(removed);
  pairs.splice(index, 1);
  return pairs;
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
