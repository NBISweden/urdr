import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { format as formatDate } from "date-fns";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";
import { QuickAdd } from "../components/QuickAdd";
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
import { AuthContext } from "../components/AuthProvider";

export const Report = () => {
  const [recentIssues, setRecentIssues] = useState<IssueActivityPair[]>([]);
  const [filteredRecents, setFilteredRecents] = useState<IssueActivityPair[]>(
    []
  );
  const [favorites, setFavorites] = useState<IssueActivityPair[]>([]);
  const [timeEntries, setTimeEntries] = useState<FetchedTimeEntry[]>([]);
  const [newTimeEntries, setNewTimeEntries] = useState<TimeEntry[]>([]);
  const today = new Date();
  const [weekTravelDay, setWeekTravelDay] = useState<Date>(today);
  const [currentWeekArray, setCurrentWeekArray] = useState(getFullWeek(today));
  const navigate = useNavigate();
  let location = useLocation();
  const context = React.useContext(AuthContext);

  const getTimeEntries = async (rowTopic: IssueActivityPair, days: Date[]) => {
    let params = new URLSearchParams({
      issue_id: `${rowTopic.issue.id}`,
      activity_id: `${rowTopic.activity.id}`,
      from: formatDate(days[0], "yyyy-MM-dd"),
      to: formatDate(days[4], "yyyy-MM-dd"),
    });
    let entries: { time_entries: FetchedTimeEntry[] } = await getApiEndpoint(
      `/api/time_entries?${params}`,
      context
    );
    if (entries) return entries.time_entries;
    return null;
  };

  const getAllEntries = async (
    favs: IssueActivityPair[],
    recents: IssueActivityPair[]
  ) => {
    let allEntries = [];
    for await (let fav of favs) {
      const favEntries = await getTimeEntries(fav, currentWeekArray);
      allEntries.push(...favEntries);
    }
    for await (let recent of recents) {
      const recentEntries = await getTimeEntries(recent, currentWeekArray);
      if (recentEntries) allEntries.push(...recentEntries);
    }
    setTimeEntries(allEntries);
  };

  React.useEffect(() => {
    let didCancel = false;
    let issues = null;
    const setRecentIssuesWithinRange = async () => {
      // Use Friday as limit for the query
      const toDate: String = formatDate(currentWeekArray[4], "yyyy-MM-dd");
      const issues: IssueActivityPair[] = await getApiEndpoint(
        `/api/recent_issues?to=${toDate}`,
        context
      );
      if (!didCancel) setRecentIssues(issues);
    };
    setRecentIssuesWithinRange();

    return () => {
      didCancel = true;
    };
  }, [weekTravelDay]);

  React.useEffect(() => {
    let didCancel = false;

    const getRowData = async () => {
      const favorites: IssueActivityPair[] = await getApiEndpoint(
        "/api/priority_entries",
        context
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
        if (!didCancel) {
          getAllEntries(favorites, nonFavIssues);
          setFilteredRecents(nonFavIssues);
          setFavorites(favorites);
        }
      } else if (!didCancel) {
        getAllEntries([], issues);
        setFilteredRecents(issues);
      }
    };
    getRowData();
    return () => {
      didCancel = true;
    };
  }, [recentIssues]);

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
    let logout = false;
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
          logout = true;
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
    if (logout) context.setUser(null);
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
    let logout = false;
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
        alert(error);
        return false;
      });
    if (logout) context.setUser(null);
    return saved;
  };

  const handleSave = async () => {
    if (newTimeEntries.length === 0) {
      alert(
        "You haven't added, edited or deleted any time entries yet, so nothing could be saved."
      );
      return;
    }
    const unsavedEntries = [];
    for await (let entry of newTimeEntries) {
      if (typeof entry.hours === "string") {
        entry.hours === ""
          ? (entry.hours = 0)
          : (entry.hours = parseFloat(entry.hours));
      }
      const saved = await reportTime(entry);
      if (!saved) {
        unsavedEntries.push(entry);
      }
    }
    if (unsavedEntries.length === 0) {
      alert("All changes were saved!");
    }
    await getAllEntries(favorites, filteredRecents);
    setNewTimeEntries(unsavedEntries);
  };

  const handleWeekTravel = (newDay: Date) => {
    setWeekTravelDay(newDay);
    setCurrentWeekArray(getFullWeek(newDay));
  };

  const addIssueActivityHandler = (pair) => {
    let recentIssue = filteredRecents.find((e) => {
      return e.issue.id === pair.issue.id && e.activity.id === pair.activity.id;
    });
    if (!recentIssue) {
      recentIssue = favorites.find((e) => {
        return (
          e.issue.id === pair.issue.id && e.activity.id === pair.activity.id
        );
      });
    }
    if (recentIssue) {
      alert("This issue/activity pair is already added");
      return;
    }
    const newRecentIssues = [...filteredRecents, pair];
    setFilteredRecents(newRecentIssues);
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

  /*
  Returns an array with five numbers representing the number of hours 
  to be displayed in the five cells of a row.
  Checks first for new time entries, i.e. unsaved changes,
  and, if there are none, for entries from the database for the respective cell.
  */
  const findRowHours = (rowTopic: IssueActivityPair, days: Date[]) => {
    let rowHours = [];
    days.map((day) => {
      let hours = 0;
      let entry: TimeEntry | FetchedTimeEntry = newTimeEntries?.find(
        (entry) =>
          entry.spent_on === formatDate(day, "yyyy-MM-dd") &&
          entry.issue_id === rowTopic.issue.id &&
          entry.activity_id === rowTopic.activity.id
      );
      if (!entry && timeEntries && timeEntries.length > 0) {
        entry = timeEntries?.find(
          (entry) =>
            entry.spent_on === formatDate(day, "yyyy-MM-dd") &&
            entry.issue.id === rowTopic.issue.id &&
            entry.activity.id === rowTopic.activity.id
        );
      }
      if (entry) {
        hours = entry.hours;
      }
      rowHours.push(hours);
      return;
    });
    return rowHours;
  };

  /*
  Returns an array of five numbers representing Redmine's entry ids of 
  entries displayed in a row. 
  If there is no entry in the database, id is 0.
  */
  const findRowEntryIds = (rowTopic: IssueActivityPair, days: Date[]) => {
    let rowEntryIds = [];
    days.map((day) => {
      let id = 0;
      let entry = timeEntries?.find(
        (entry) =>
          entry.spent_on === formatDate(day, "yyyy-MM-dd") &&
          entry.issue.id === rowTopic.issue.id &&
          entry.activity.id === rowTopic.activity.id
      );
      if (entry) {
        id = entry.id;
      }
      rowEntryIds.push(id);
    });
    return rowEntryIds;
  };

  if (context.user === null) return <></>;
  return (
    <>
      <header>
        <div className="report-header">
          <h1 className="header-year">{weekTravelDay.getFullYear()}</h1>
          <TimeTravel
            weekTravelDay={weekTravelDay}
            onWeekTravel={handleWeekTravel}
            currentWeekArray={currentWeekArray}
          />
          <HeaderUser username={context.user ? context.user.login : ""} />
        </div>
      </header>
      <main>
        {favorites && favorites.length > 0 && (
          <DragDropContext onDragEnd={onDragEnd}>
            <section className="favorites-container">
              <HeaderRow days={currentWeekArray} />
              <Droppable droppableId="favorites">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {favorites &&
                      favorites.map((fav, index) => {
                        return (
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
                                  rowHours={findRowHours(fav, currentWeekArray)}
                                  rowEntryIds={findRowEntryIds(
                                    fav,
                                    currentWeekArray
                                  )}
                                  isFav={true}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </section>
          </DragDropContext>
        )}
        <section className="recent-container">
          <HeaderRow days={favorites.length > 0 ? [] : currentWeekArray} />
          {filteredRecents &&
            filteredRecents.map((recentIssue) => {
              return (
                <Row
                  key={`${recentIssue.issue.id}${recentIssue.activity.id}`}
                  topic={recentIssue}
                  onCellUpdate={handleCellUpdate}
                  onToggleFav={handleToggleFav}
                  days={currentWeekArray}
                  rowHours={findRowHours(recentIssue, currentWeekArray)}
                  rowEntryIds={findRowEntryIds(recentIssue, currentWeekArray)}
                  isFav={false}
                />
              );
            })}
        </section>
        <section className="save-button-container">
          <button className="basic-button save-button" onClick={handleSave}>
            Save changes
          </button>
        </section>
      </main>
      <section className="recent-container">
        <QuickAdd addIssueActivity={addIssueActivityHandler}></QuickAdd>
      </section>
    </>
  );
};
