import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";
import { QuickAdd } from "../components/QuickAdd";
import { useNavigate } from "react-router-dom";
import {
  User,
  IssueActivityPair,
  TimeEntry,
  SNOWPACK_PUBLIC_API_URL,
} from "../model";

export const Report = () => {
  const navigate = useNavigate();
  const [recentIssues, setRecentIssues] = useState<IssueActivityPair[]>([]);
  const [favorites, setFavorites] = useState<IssueActivityPair[]>([]);
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

  const getRowTopics = async () => {
    const favorites: IssueActivityPair[] = await fetch(
      `${SNOWPACK_PUBLIC_API_URL}/api/favorites`,
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
          throw new Error("Could not find favorites.");
        }
      })
      .catch((error) => console.log(error));

    const issues: IssueActivityPair[] = await fetch(
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

    if (!!favorites) {
      let nonFavIssues = [];
      issues.forEach((issue, index) => {
        let match = favorites.find(
          (fav) =>
            fav.issue.id === issue.issue.id &&
            fav.activity.id === issue.activity.id
        );
        if (!match) {
          nonFavIssues.push(issue);
        }
      });
      setRecentIssues(nonFavIssues);
      setFavorites(favorites);
    } else {
      setRecentIssues(issues);
    }
  };

  React.useEffect(() => {
    getRowTopics();
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

  const saveFavorites = async (newFavs: IssueActivityPair[]) => {
    const saved = await fetch(`${SNOWPACK_PUBLIC_API_URL}/api/favorites`, {
      method: "POST",
      credentials: "include",
      headers: headers,
      body: JSON.stringify(newFavs),
    })
      .then((res) => {
        if (res.ok) {
          return true;
        } else if (res.status === 401) {
          // Redirect to login page
          navigate("/");
        } else {
          throw new Error("Could not save favorites.");
        }
      })
      .catch((error) => {
        console.log(error);
        return false;
      });
    return saved;
  };

  const handleToggleFav = async (topic: IssueActivityPair) => {
    const existingFav = favorites.find(
      (fav) =>
        fav.activity.id === topic.activity.id && fav.issue.id === topic.issue.id
    );
    if (!existingFav) {
      topic.custom_name = `${topic.issue.subject} - ${topic.activity.name}`;
      const saved = await saveFavorites([...favorites, topic]);
      if (!saved) {
        console.log("Something went wrong with adding a favorite!");
        return;
      }
      getRowTopics();
    } else {
      const favs = favorites.map((fav) => fav);
      const removed = favs.find(
        (fav) =>
          fav.activity.id === topic.activity.id &&
          fav.issue.id === topic.issue.id
      );
      const index = favs.indexOf(removed);
      favs.splice(index, 1);
      const saved = await saveFavorites(favs);
      if (!saved) {
        console.log("Something went wrong with removing a favorite!");
        return;
      }
      getRowTopics();
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
        } else if (response.status === 401) {
          // Redirect to login page
          navigate("/");
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
      {favorites.length > 0 ? (
        <section className="recent-container">
          <HeaderRow days={thisWeek} title="Favorites" />
          {favorites &&
            favorites.map((fav) => {
              const rowUpdates = newTimeEntries?.filter(
                (entry) =>
                  entry.issue_id === fav.issue.id &&
                  entry.activity_id === fav.activity.id
              );
              return (
                <>
                  <Row
                    key={`${fav.issue.id}${fav.activity.id}`}
                    topic={fav}
                    onCellUpdate={handleCellUpdate}
                    onToggleFav={handleToggleFav}
                    days={thisWeek}
                    rowUpdates={rowUpdates}
                    onReset={handleReset}
                    saved={toggleSave}
                    isFav={true}
                  />
                </>
              );
            })}
        </section>
      ) : (
        <div></div>
      )}
      <section className="recent-container">
        <HeaderRow
          days={favorites.length > 0 ? [] : thisWeek}
          title="Recent issues"
        />
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
                  onToggleFav={handleToggleFav}
                  days={thisWeek}
                  rowUpdates={rowUpdates}
                  onReset={handleReset}
                  saved={toggleSave}
                  isFav={false}
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
