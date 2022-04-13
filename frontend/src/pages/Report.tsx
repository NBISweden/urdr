import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";
import { QuickAdd } from "../components/QuickAdd";
import { useNavigate } from "react-router-dom";
import { HeaderUser } from "../components/HeaderUser";
import { User, IssueActivityPair, TimeEntry, FetchedTimeEntry } from "../model";
import {
  SNOWPACK_PUBLIC_API_URL,
  getApiEndpoint,
  headers,
  getFullWeek,
  removeIssueActivityPair,
} from "../utils";
import { TimeTravel } from "../components/TimeTravel";
import { format as formatDate } from "date-fns";

export const Report = () => {
  const navigate = useNavigate();

  const [recentIssues, setRecentIssues] = useState<IssueActivityPair[]>([]);
  const [filteredRecents, setFilteredRecents] = useState<IssueActivityPair[]>(
    []
  );
  const [favorites, setFavorites] = useState<IssueActivityPair[]>([]);
  const [timeEntries, setTimeEntries] = useState<FetchedTimeEntry[]>([]);
  const [newTimeEntries, setNewTimeEntries] = useState<TimeEntry[]>([]);
  const [toggleSave, setToggleSave] = useState(false);
  const today = new Date();
  const [weekTravelDay, setWeekTravelDay] = useState<Date>(today);
  const [currentWeekArray, setCurrentWeekArray] = useState(getFullWeek(today));
  let location = useLocation();
  const user: User = location.state as User;

  const getRecentIssuesWithinRange = async () => {
    // Use Friday as limit for the query
    const toDate: String = formatDate(currentWeekArray[4], "yyyy-MM-dd");
    const issues: IssueActivityPair[] = await getApiEndpoint(
      `/api/recent_issues?to=${toDate}`
    );
    setRecentIssues(issues);
  };

  const getRowTopics = async () => {
    const favorites: IssueActivityPair[] = await getApiEndpoint(
      "/api/priority_entries"
    );

    const issues = [...recentIssues];

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
      setFilteredRecents(nonFavIssues);
      setFavorites(favorites);
    } else {
      setFilteredRecents(issues);
    }
  };

  React.useEffect(() => {
    getRecentIssuesWithinRange();
  }, [weekTravelDay]);
  React.useEffect(() => {
    console.log("recent issues", recentIssues);
    getRowTopics();
  }, [recentIssues]);

  const getTimeEntries = async (rowTopic: IssueActivityPair, days: Date[]) => {
    console.log("getting time entries");
    let params = new URLSearchParams({
      issue_id: `${rowTopic.issue.id}`,
      activity_id: `${rowTopic.activity.id}`,
      from: formatDate(days[0], "yyyy-MM-dd"),
      to: formatDate(days[4], "yyyy-MM-dd"),
    });
    let entries: { time_entries: FetchedTimeEntry[] } = await getApiEndpoint(
      `/api/time_entries?${params}`
    );
    return entries.time_entries;
  };

  React.useEffect(() => {
    if (!(!!favorites && !!filteredRecents && !!currentWeekArray)) {
      return;
    }
    const getAllEntries = async () => {
      let allEntries = [];
      for await (let fav of favorites) {
        const favEntries = await getTimeEntries(fav, currentWeekArray);
        allEntries.push(...favEntries);
      }
      for await (let recent of filteredRecents) {
        const recentEntries = await getTimeEntries(recent, currentWeekArray);
        allEntries.push(...recentEntries);
      }
      setTimeEntries(allEntries);
    };
    getAllEntries();
  }, [favorites, filteredRecents, currentWeekArray]);

  const handleCellUpdate = (timeEntry: TimeEntry): void => {
    const entries = [...newTimeEntries];
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
    const saved = await fetch(
      `${SNOWPACK_PUBLIC_API_URL}/api/priority_entries`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(newFavs),
      }
    )
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
        alert(error);
        const favs = [...favorites];
        setFavorites(favs);
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
      setFavorites([...favorites, topic]);
      const shortenedRecents = removeIssueActivityPair(
        [...filteredRecents],
        topic
      );
      setFilteredRecents(shortenedRecents);
    } else {
      const shortenedFavs = removeIssueActivityPair([...favorites], topic);
      const saved = await saveFavorites(shortenedFavs);
      if (!saved) {
        console.log("Something went wrong with removing a favorite!");
        return;
      }
      setFavorites(shortenedFavs);
      setFilteredRecents([topic, ...filteredRecents]);
    }
  };

  const reportTime = async (timeEntry: TimeEntry) => {
    const saved = await fetch(`${SNOWPACK_PUBLIC_API_URL}/api/time_entries`, {
      body: JSON.stringify({ time_entry: timeEntry }),
      method: "POST",
      headers: headers,
    })
      .then((response) => {
        if (response.ok) {
          console.log("Time reported");
          return true;
        } else if (response.status === 401) {
          // Redirect to login page
          navigate("/");
        } else if (response.status === 422) {
          throw new Error(
            `Issue ${timeEntry.issue_id} does not allow to register time on this activity`
          );
        } else {
          throw new Error(`Time report on issue ${timeEntry.issue_id} failed.`);
        }
      })
      .catch((error) => {
        alert(error);
        return false;
      });
    return saved;
  };

  const handleSave = () => {
    if (newTimeEntries.length === 0) {
      alert(
        "You haven't added, edited or deleted any time entries yet, so nothing could be saved."
      );
      return;
    }
    const unsavedEntries = [];
    newTimeEntries.forEach(async (entry) => {
      const saved = await reportTime(entry);
      if (!saved) {
        unsavedEntries.push(entry);
        return;
      }
      return;
    });
    if (unsavedEntries.length === 0) {
      alert("All changes were saved!");
    }
    setToggleSave(!toggleSave);
    setTimeout(() => {
      setNewTimeEntries(unsavedEntries);
    }, 1000);
  };

  const handleWeekTravel = (newDay: Date) => {
    setWeekTravelDay(newDay);
    setCurrentWeekArray(getFullWeek(newDay));
  };

  const addIssueActivityHandler = (pair) => {
    const recentIssue = recentIssues.find((e) => {
      return e.issue.id === pair.issue.id && e.activity.id === pair.activity.id;
    });
    if (recentIssue) {
      alert("This issue/activity pair is already added");
      return;
    }
    const newRecentIssues = [...recentIssues, pair];
    setRecentIssues(newRecentIssues);
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const startIndex = result.source.index;
    const endIndex = result.destination.index;

    if (startIndex === endIndex) {
      return;
    }

    const favs = [...favorites];
    const [moved] = favs.splice(startIndex, 1);
    favs.splice(endIndex, 0, moved);
    setFavorites(favs);
    saveFavorites(favs);
    return;
  };

  return (
    <>
      <div className="report-header">
        <p className="header-year">{weekTravelDay.getFullYear()}</p>
        <TimeTravel
          weekTravelDay={weekTravelDay}
          onWeekTravel={handleWeekTravel}
          currentWeekArray={currentWeekArray}
        />
        <HeaderUser username={user ? user.login : ""} />
      </div>
      {favorites.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <section className="favorites-container">
            <HeaderRow days={currentWeekArray} />
            <Droppable droppableId="favorites">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {favorites &&
                    favorites.map((fav, index) => {
                      const rowUpdates = newTimeEntries?.filter(
                        (entry) =>
                          entry.issue_id === fav.issue.id &&
                          entry.activity_id === fav.activity.id
                      );
                      return (
                        <>
                          <Draggable
                            draggableId={`${fav.issue.id}${fav.activity.id}`}
                            index={index}
                            key={`${fav.issue.id}${fav.activity.id}-drag`}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Row
                                  key={`${fav.issue.id}${fav.activity.id}`}
                                  topic={fav}
                                  onCellUpdate={handleCellUpdate}
                                  onToggleFav={handleToggleFav}
                                  days={currentWeekArray}
                                  rowUpdates={rowUpdates}
                                  saved={toggleSave}
                                  isFav={true}
                                />
                              </div>
                            )}
                          </Draggable>
                        </>
                      );
                    })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </section>
        </DragDropContext>
      ) : (
        <div></div>
      )}
      <section className="recent-container">
        <HeaderRow days={favorites.length > 0 ? [] : currentWeekArray} />
        {filteredRecents &&
          filteredRecents.map((recentIssue) => {
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
                  days={currentWeekArray}
                  rowUpdates={rowUpdates}
                  saved={toggleSave}
                  isFav={false}
                />
              </>
            );
          })}
      </section>
      <section className="save-button-container">
        <button className="basic-button save-button" onClick={handleSave}>
          Save changes
        </button>
      </section>
      <section className="recent-container">
        <QuickAdd addIssueActivity={addIssueActivityHandler}></QuickAdd>
      </section>
    </>
  );
};
