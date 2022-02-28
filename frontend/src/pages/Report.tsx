import React, { useState } from "react";

export interface Activity {
  id: number;
  name: string;
}

export interface recentIssue {
  id: number;
  name: string;
  activity: Activity;
}

export const Report = () => {
  const [recentIssues, setRecentIssues] = useState<recentIssue[]>([]);

  let headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  const getRecentIssues = () => {
    return [
      {
        id: 1,
        name: "First dummy issue",
        activity: {
          id: 1,
          name: "testing",
        },
      },
      {
        id: 2,
        name: "Second dummy issue",
        activity: {
          id: 1,
          name: "testing",
        },
      },
      {
        id: 3,
        name: "Third dummy issue",
        activity: {
          id: 1,
          name: "testing",
        },
      },
      {
        id: 4,
        name: "Fourth dummy issue",
        activity: {
          id: 1,
          name: "testing",
        },
      },
      {
        id: 5,
        name: "Fifth dummy issue",
        activity: {
          id: 2,
          name: "development",
        },
      },
    ];
  };

  React.useEffect(() => {
    const newIssues: recentIssue[] = getRecentIssues();
    setRecentIssues(newIssues);
  }, []);

  function reportTime() {
    // We are not doing account linking

    let timeLog: TimeEntry = {
      issue_id: Number(issue),
      activity_id: Number(activity),
      hours: Number(hours),
      comments: "",
      spent_on: date,
      user_id: 232,
    };
    console.log(timeLog);

    fetch("http://localhost:8080/api/report", {
      body: JSON.stringify(timeLog),
      method: "POST",
      credentials: "include",
      headers: headers,
    }).then((response) => {
      if (response.ok) {
        console.log("Time reported");
      } else {
        console.log("Time report failed");
      }
    });
  }

  return <input type="button" onClick={reportTime} value="Report time" />;
};
