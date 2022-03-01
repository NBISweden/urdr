import React, { useState } from "react";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";

export interface Activity {
  id: number;
  name: string;
}

export interface recentIssue {
  id: number;
  name: string;
  activity: Activity;
}

export interface TimeEntry {
  // snake case to follow Redmines variable names
  issue_id: number;
  activity_id: number;
  hours: number;
  comments: string;
  spent_on: string;
  user_id: number;
}

export const Report = () => {
  const [recentIssues, setRecentIssues] = useState<recentIssue[]>([]);
  const [newTimeEntries, setNewTimeEntries] = useState<TimeEntry[]>([]);

  let headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  const today = new Date();

  const getRecentIssues = () => {
    // Here we should do an API fetch. The recent issues endpoint doesn't exist yet.
    return [
      {
        id: 5068,
        name: "First dummy issue",
        activity: {
          id: 10,
          name: "testing",
        },
      },
      {
        id: 5140,
        name: "Second dummy issue",
        activity: {
          id: 19,
          name: "testing",
        },
      },
      {
        id: 5214,
        name: "Third dummy issue",
        activity: {
          id: 8,
          name: "testing",
        },
      },
      {
        id: 5849,
        name: "Fourth dummy issue",
        activity: {
          id: 10,
          name: "testing",
        },
      },
      {
        id: 5763,
        name: "Fifth dummy issue",
        activity: {
          id: 9,
          name: "development",
        },
      },
    ];
  };

  React.useEffect(() => {
    const newIssues: recentIssue[] = getRecentIssues();
    setRecentIssues(newIssues);
  }, []);

  const handleCellUpdate = (timeEntry: TimeEntry): void => {
    const entries = newTimeEntries;
    const existingEntry = entries.find(
      (entry) =>
        entry.issue_id === timeEntry.issue_id &&
        entry.activity_id === timeEntry.activity_id &&
        entry.spent_on === timeEntry.spent_on
    );
    if (existingEntry) {
      entries.splice(entries.indexOf(existingEntry), 1, timeEntry);
      setNewTimeEntries(entries);
    } else {
      setNewTimeEntries([...entries, timeEntry]);
    }
  };

  const reportTime = (timeEntry: TimeEntry) => {
    fetch("http://localhost:8080/api/report", {
      body: JSON.stringify(timeEntry),
      method: "POST",
      credentials: "include",
      headers: headers,
    })
      .then((response) => {
        if (response.ok) {
          console.log("Time reported");
        } else {
          throw new Error("Time report failed.");
        }
      })
      .catch((error) => console.log(error));
  };

  const handleSave = () => {
    newTimeEntries.forEach((entry) => {
      reportTime(entry);
    });
  };

  return (
    <>
      <HeaderRow
        days={[today.toISOString().split("T")[0]]}
        title="Recent issues"
      />
      {recentIssues.map((issue) => {
        return (
          <>
            <Row
              recentIssue={issue}
              onCellUpdate={handleCellUpdate}
              days={[today]}
            />
          </>
        );
      })}
      <button onClick={handleSave}>Save changes</button>
    </>
  );
};
