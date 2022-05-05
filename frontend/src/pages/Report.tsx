import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { format as formatDate } from "date-fns";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";
import { QuickAdd } from "../components/QuickAdd";
import { HeaderUser } from "../components/HeaderUser";
import { IssueActivityPair, TimeEntry, FetchedTimeEntry } from "../model";
import {
  SNOWPACK_PUBLIC_API_URL,
  getApiEndpoint,
  headers,
  getFullWeek,
  removeIssueActivityPair,
  dateFormat,
} from "../utils";
import { TimeTravel } from "../components/TimeTravel";
import { AuthContext } from "../components/AuthProvider";

const beforeUnloadHandler = (event) => {
  event.preventDefault();
  event.returnValue = "";
};

export const Report = () => {
  const [recentIssues, setRecentIssues] = useState<IssueActivityPair[]>([]);
  const [filteredRecents, setFilteredRecents] = useState<IssueActivityPair[]>(
    []
  );
  const [favorites, setFavorites] = useState<IssueActivityPair[]>([]);
  const [hidden, setHidden] = useState<IssueActivityPair[]>([]);
  const [timeEntries, setTimeEntries] = useState<FetchedTimeEntry[]>([]);
  const [newTimeEntries, setNewTimeEntries] = useState<TimeEntry[]>([]);
  const today = new Date();
  const [weekTravelDay, setWeekTravelDay] = useState<Date>(today);
  const [currentWeekArray, setCurrentWeekArray] = useState(getFullWeek(today));
  const context = React.useContext(AuthContext);

  const getTimeEntries = async (rowTopic: IssueActivityPair, days: Date[]) => {
    let params = new URLSearchParams({
      issue_id: `${rowTopic.issue.id}`,
      activity_id: `${rowTopic.activity.id}`,
      from: formatDate(days[0], dateFormat),
      to: formatDate(days[4], dateFormat),
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
    const setRecentIssuesWithinRange = async () => {
      // Use Friday as limit for the query
      const toDate: String = formatDate(currentWeekArray[4], dateFormat);
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
      const priorityIssues: IssueActivityPair[] = await getApiEndpoint(
        "/api/priority_entries",
        context
      );
      const issues = [...recentIssues];
      if (!!priorityIssues) {
        let nonPrioIssues = [];
        issues.forEach((issue) => {
          let match = priorityIssues.find(
            (fav) =>
              fav.issue.id === issue.issue.id &&
              fav.activity.id === issue.activity.id
          );
          if (!match) {
            nonPrioIssues.push(issue);
          }
        });
        if (!didCancel) {
          const favorites = priorityIssues.filter((issue) => !issue.is_hidden);
          const hidden = priorityIssues.filter((issue) => issue.is_hidden);
          getAllEntries(favorites, nonPrioIssues);
          setFilteredRecents(nonPrioIssues);
          setFavorites(favorites);
          setHidden(hidden);
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

  React.useEffect(() => {
    window.removeEventListener("beforeunload", beforeUnloadHandler, true);
    if (newTimeEntries.length > 0) {
      window.addEventListener("beforeunload", beforeUnloadHandler, true);
    }
  }, [newTimeEntries]);

  const handleCellUpdate = (timeEntry: TimeEntry): void => {
    const entries = [...newTimeEntries];
    //check if there already is a new entry for same cell
    const existingNewEntry = entries.find(
      (entry) =>
        entry.issue_id === timeEntry.issue_id &&
        entry.activity_id === timeEntry.activity_id &&
        entry.spent_on === timeEntry.spent_on
    );
    // if yes, remove it
    if (existingNewEntry) {
      entries.splice(entries.indexOf(existingNewEntry), 1);
    }
    // check if there is an entry in the db for this cell
    const existingOldEntry = timeEntries.find(
      (entry) =>
        entry.issue.id === timeEntry.issue_id &&
        entry.activity.id === timeEntry.activity_id &&
        entry.spent_on === timeEntry.spent_on &&
        entry.comments === timeEntry.comments
    );
    // If there is one, check if it has the same hours.
    // If there is none, check if the incoming entry's hours are 0.
    // In both cases don't add the incoming entry.
    if (
      (existingOldEntry && existingOldEntry.hours === +timeEntry.hours) ||
      (!existingOldEntry && timeEntry.hours === 0)
    ) {
      setNewTimeEntries([...entries]);
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
      const saved = await saveFavorites([...favorites, topic, ...hidden]);
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
      const saved = await saveFavorites([...shortenedFavs, ...hidden]);
      if (!saved) {
        console.log("Something went wrong with removing a favorite!");
        return;
      }
      setFavorites(shortenedFavs);
      setFilteredRecents([topic, ...filteredRecents]);
    }
  };

  const handleHide = async (topic: IssueActivityPair) => {
    topic.is_hidden = true;
    topic.custom_name = `${topic.issue.subject} - ${topic.activity.name}`;
    const saved = await saveFavorites([...favorites, ...hidden, topic]);
    if (!saved) {
      console.log("Something went wrong with hiding the row");
      return;
    } else {
      const newRecents = removeIssueActivityPair([...filteredRecents], topic);
      setFilteredRecents(newRecents);
      setHidden([...hidden, topic]);
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

  const addIssueActivityHandler = async (pair: IssueActivityPair) => {
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
    const existingHidden = hidden.find((e) => {
      return e.issue.id === pair.issue.id && e.activity.id === pair.activity.id;
    });
    if (existingHidden) {
      const newHiddens = removeIssueActivityPair([...hidden], pair);
      const saved = await saveFavorites([...favorites, ...newHiddens]);
      if (!saved) {
        console.log(
          "Something went wrong with adding the issue (was previously hidden)."
        );
        return;
      } else {
        setHidden(newHiddens);
      }
    }
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
      let hours: number = null;
      let entry: TimeEntry | FetchedTimeEntry = newTimeEntries?.find(
        (entry) =>
          entry.spent_on === formatDate(day, dateFormat) &&
          entry.issue_id === rowTopic.issue.id &&
          entry.activity_id === rowTopic.activity.id
      );
      if (!entry && timeEntries && timeEntries.length > 0) {
        entry = timeEntries?.find(
          (entry) =>
            entry.spent_on === formatDate(day, dateFormat) &&
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
  Returns an object with Redmine's entry ids and comments of
  entries displayed in a row.
  If there is no entry in the database, id is 0.
  */
  const findRowMetadata = (rowTopic: IssueActivityPair, days: Date[]) => {
    let rowEntryIds = [];
    let comments = [];
    days.map((day) => {
      let id = 0;
      let comment = "";
      let entry = timeEntries?.find(
        (entry) =>
          entry.spent_on === formatDate(day, dateFormat) &&
          entry.issue.id === rowTopic.issue.id &&
          entry.activity.id === rowTopic.activity.id
      );
      if (entry) {
        id = entry.id;
        comment = entry.comments;
      }
      rowEntryIds.push(id);
      comments.push(comment);
    });
    return { ids: rowEntryIds, comments: comments };
  };

  const getTotalHoursWeek = () => {
    let count = 0;
    currentWeekArray.map((date) => {
      const dateStr = formatDate(date, dateFormat);
      count += getTotalHours(dateStr);
    });
    return count;
  };

  const getTotalHours = (date: string) => {
    let count: number = 0;
    const dateEntries = timeEntries.filter(
      (entry) =>
        entry.spent_on === date &&
        newTimeEntries.filter(
          (newEntry) =>
            newEntry.spent_on === date &&
            newEntry.activity_id === entry.activity.id &&
            newEntry.issue_id === entry.issue.id
        ).length == 0
    );
    dateEntries.map((entry) => {
      count += entry.hours;
    });
    newTimeEntries.map((entry) => {
      if (entry.spent_on === date) count += entry.hours;
    });

    return count;
  };

  const getRowSum = (pair: IssueActivityPair) => {
    let count = 0;
    const rowEntries = timeEntries.filter(
      (entry) =>
        pair.activity.id === entry.activity.id &&
        pair.issue.id === entry.issue.id &&
        newTimeEntries.filter(
          (newEntry) =>
            newEntry.spent_on === entry.spent_on &&
            newEntry.activity_id === pair.activity.id &&
            newEntry.issue_id === pair.issue.id
        ).length == 0
    );
    rowEntries.map((entry) => {
      count += entry.hours;
    });
    newTimeEntries.map((entry) => {
      if (
        pair.activity.id === entry.activity_id &&
        pair.issue.id === entry.issue_id
      )
        count += entry.hours;
    });
    return count;
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
                        const rowMetadata = findRowMetadata(
                          fav,
                          currentWeekArray
                        );
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
                                  rowComments={rowMetadata.comments}
                                  rowEntryIds={rowMetadata.ids}
                                  getRowSum={getRowSum}
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
          {favorites.length == 0 && (
            <HeaderRow days={currentWeekArray}></HeaderRow>
          )}
          {filteredRecents &&
            filteredRecents.map((recentIssue) => {
              const rowMetadata = findRowMetadata(
                recentIssue,
                currentWeekArray
              );
              return (
                <Row
                  key={`${recentIssue.issue.id}${recentIssue.activity.id}`}
                  topic={recentIssue}
                  onCellUpdate={handleCellUpdate}
                  onToggleFav={handleToggleFav}
                  onHide={handleHide}
                  days={currentWeekArray}
                  rowHours={findRowHours(recentIssue, currentWeekArray)}
                  rowComments={rowMetadata.comments}
                  rowEntryIds={rowMetadata.ids}
                  getRowSum={getRowSum}
                  isFav={false}
                />
              );
            })}
        </section>
        <section className="recent-container ">
          <div className="row">
            <div className="col-6">
              <h2>Total</h2>
            </div>
            {currentWeekArray &&
              currentWeekArray.map((date) => {
                const dateStr = formatDate(date, dateFormat);
                return (
                  <div key={dateStr} className="col-1 cell-container">
                    <input
                      type="text"
                      id={dateStr}
                      className="cell not-outline"
                      value={getTotalHours(dateStr)}
                      readOnly
                    />
                  </div>
                );
              })}
            <div className="col-1 cell-container">
              <input
                type="text"
                className="cell not-outline"
                value={getTotalHoursWeek()}
                readOnly
              />
            </div>
          </div>
        </section>
        <section className="save-button-container">
          {newTimeEntries.length > 0 && (
            <div className="unsaved-alert-p">
              <p role="status">⚠ You have unsaved changes</p>
            </div>
          )}
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
