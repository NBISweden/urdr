import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";
import { User } from "../pages/Login";

// interfaces use snake case to follow Redmines variable names

export interface IdName {
  id: number;
  name: string;
}

export interface RecentIssue {
  activity: IdName;
  issue: Issue;
}

export interface Issue {
  assigned_to: IdName;
  assigned_to_id: number;
  author: IdName;
  category: IdName;
  category_id: number;
  closed_on: string;
  created_on: string;
  description: string;
  done_ratio: number;
  due_date: string;
  estimated_hours: number;
  id: number;
  notes: string;
  project: IdName;
  project_id: number;
  start_date: string;
  status: IdName;
  status_date: string;
  status_id: 0;
  subject: string;
  updated_on: string;
}

export interface TimeEntry {
  issue_id: number;
  activity_id: number;
  hours: number;
  comments: string;
  spent_on: string;
  user_id: number;
}

export const Report = () => {
  const [recentIssues, setRecentIssues] = useState<RecentIssue[]>([]);
  const [newTimeEntries, setNewTimeEntries] = useState<TimeEntry[]>([]);
  let location = useLocation();
  const user: User = location.state as User;

  let headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  const today = new Date();

  const getRecentIssues = async () => {
    let issues: RecentIssue[] = await fetch(
      "http://localhost:8080/api/recent_issues",
      {
        method: "GET",
        credentials: "include",
        headers: headers,
      }
    )
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("Could not find recent issues.");
        }
      })
      .catch((error) => console.log(error));

    console.log(issues);
    setRecentIssues(issues);
  };

  React.useEffect(() => {
    getRecentIssues();
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
          setNewTimeEntries([]);
          alert("Changes saved!");
        } else {
          throw new Error("Time report failed.");
        }
      })
      .catch((error) => alert(error));
  };

  const handleSave = () => {
    newTimeEntries.forEach((entry) => {
      reportTime(entry);
    });
  };

  return (
    <>
      <section className="recent-container">
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
                userId={user.user_id}
              />
            </>
          );
        })}
      </section>
      <button
        className="save-button"
        onClick={handleSave}
        disabled={newTimeEntries.length === 0}
      >
        Save changes
      </button>
    </>
  );
};
