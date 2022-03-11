import.meta.hot;
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";
import { User } from "../pages/Login";

// interfaces use snake case to follow Redmines variable names

export interface Id {
  id: number;
}

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
  id: number;
  issue_id: number;
  activity_id: number;
  hours: number;
  comments: string;
  spent_on: string;
  user_id: number;
}

export interface FetchedTimeEntry {
  id: number;
  project: IdName;
  issue: Id;
  user: IdName;
  activity: IdName;
  hours: number;
  comments: string;
  spent_on: string;
  created_on: string;
  updated_on: string;
}

export const Report = () => {
  const [recentIssues, setRecentIssues] = useState<RecentIssue[]>([]);
  const [newTimeEntries, setNewTimeEntries] = useState<TimeEntry[]>([]);
  const [toggleSave, setToggleSave] = useState(false);
  let location = useLocation();
  const user: User = location.state as User;
  const { SNOWPACK_PUBLIC_API_URL } = __SNOWPACK_ENV__;

  let headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  const today = new Date();
  const addDays = (date: Date, days: number) => {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  const getFullWeek = (today: Date): Date[] => {
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
  const thisWeek = getFullWeek(today);

  const getRecentIssues = async () => {
    let issues: RecentIssue[] = await fetch(
      `${SNOWPACK_PUBLIC_API_URL}/api/recent_issues`,
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
    const entries = newTimeEntries.map((entry) => {
      return entry;
    });
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
    fetch(`${SNOWPACK_PUBLIC_API_URL}/api/report`, {
      body: JSON.stringify(timeEntry),
      method: "POST",
      credentials: "include",
      headers: headers,
    })
      .then((response) => {
        if (response.ok) {
          console.log("Time reported");
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
    setToggleSave(!toggleSave);
  };

  const handleReset = () => {
    setNewTimeEntries([]);
  };

  return (
    <>
      <section className="recent-container">
        <HeaderRow days={thisWeek} title="Recent issues" />
<<<<<<< HEAD
        {recentIssues &&
          recentIssues.map((issue) => {
            const rowUpdates = newTimeEntries?.filter(
              (entry) =>
                entry.issue_id === issue.issue.id &&
                entry.activity_id === issue.activity.id
            );
            return (
              <>
                <Row
                  key={`${issue.issue.id}${issue.activity.id}`}
                  recentIssue={issue}
                  onCellUpdate={handleCellUpdate}
                  days={thisWeek}
                  userId={user.user_id}
                  rowUpdates={rowUpdates}
                />
              </>
            );
          })}
=======
        {recentIssues.map((issue) => {
          const rowUpdates = newTimeEntries?.filter(
            (entry) =>
              entry.issue_id === issue.issue.id &&
              entry.activity_id === issue.activity.id
          );
          return (
            <>
              <Row
                key={`${issue.issue.id}${issue.activity.id}`}
                recentIssue={issue}
                onCellUpdate={handleCellUpdate}
                onReset={handleReset}
                saved={toggleSave}
                days={thisWeek}
                userId={user.user_id}
                rowUpdates={rowUpdates}
              />
            </>
          );
        })}
>>>>>>> f7c6ef2 (remove number flickering on save)
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
