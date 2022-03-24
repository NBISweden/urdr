import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";
import { QuickAdd } from "../components/QuickAdd";
import {
  User,
  RecentIssue,
  TimeEntry,
  Favorite,
  SNOWPACK_PUBLIC_API_URL,
} from "../model";

export const Report = () => {
  const [recentIssues, setRecentIssues] = useState<IssueActivityPair[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [newTimeEntries, setNewTimeEntries] = useState<TimeEntry[]>([]);
  const [toggleSave, setToggleSave] = useState(false);
  let location = useLocation();
  const user: User = location.state as User;

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
    let issues: IssueActivityPair[] = await fetch(
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

    setRecentIssues(issues);
  };

  const getFavorites = async () => {
    // let favorites: Favorite[] = await fetch(
    //   `${SNOWPACK_PUBLIC_API_URL}/api/favorites`,
    //   {
    //     method: "GET",
    //     credentials: "include",
    //     headers: headers,
    //   }
    // )
    //   .then((res) => {
    //     if (res.ok) {
    //       return res.json();
    //     } else {
    //       throw new Error("Could not find favorites.");
    //     }
    //   })
    //   .catch((error) => console.log(error));

    // console.log(favorites);
    // setFavorites(favorites);
    console.log(dummyFavorites);
    setFavorites(dummyFavorites);
  };

  const dummyFavorites = [
    {
      redmine_user_id: 266,
      redmine_issue_id: 5849,
      redmine_activity_id: 10,
      name: "My favorite scrum course",
      priority: 1,
    },
    {
      redmine_user_id: 266,
      redmine_issue_id: 5763,
      redmine_activity_id: 9,
      name: "My favorite team work",
      priority: 2,
    },
    {
      redmine_user_id: 266,
      redmine_issue_id: 5214,
      redmine_activity_id: 8,
      name: "My favorite website",
      priority: 3,
    },
  ];

  React.useEffect(() => {
    getRecentIssues();
    getFavorites();
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
    fetch(`${SNOWPACK_PUBLIC_API_URL}/api/time_entries`, {
      body: JSON.stringify({ time_entry: timeEntry }),
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
        {recentIssues &&
          recentIssues.map((recentIssue) => {
            const rowUpdates = newTimeEntries?.filter(
              (entry) =>
                entry.issue_id === recentIssue.issue.id &&
                entry.activity_id === recentIssue.activity.id
            );
            return (
              <>
                <Row
                  key={`${recentIssue.issue.id}${recentIssue.activity.id}`}
                  topic={recentIssue}
                  onCellUpdate={handleCellUpdate}
                  days={thisWeek}
                  rowUpdates={rowUpdates}
                  onReset={handleReset}
                  saved={toggleSave}
                />
              </>
            );
          })}
      </section>
      <section className="save-button-container">
        <button
          className="basic-button save-button"
          onClick={handleSave}
          disabled={newTimeEntries.length === 0}
        >
          Save changes
        </button>
      </section>
      <section className="recent-container">
        <QuickAdd></QuickAdd>
      </section>
    </>
  );
};
