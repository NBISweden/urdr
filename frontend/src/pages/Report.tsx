import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  format as formatDate,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  isPast,
  addDays,
} from "date-fns";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";
import { QuickAdd } from "../components/QuickAdd";
import { Toast } from "../components/Toast";
import { HeaderUser } from "../components/HeaderUser";
import {
  IssueActivityPair,
  TimeEntry,
  FetchedTimeEntry,
  ToastMsg,
} from "../model";
import {
  SNOWPACK_PUBLIC_API_URL,
  getApiEndpoint,
  headers,
  getFullWeek,
  dateFormat,
} from "../utils";
import { TimeTravel } from "../components/TimeTravel";
import { AuthContext } from "../components/AuthProvider";
import { useParams } from "react-router-dom";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import LoadingOverlay from "react-loading-overlay-ts";
import warning from "../icons/exclamation-triangle.svg";
import check from "../icons/check.svg";
import up from "../icons/caret-up-fill.svg";
import down from "../icons/caret-down-fill.svg";

const beforeUnloadHandler = (event) => {
  event.preventDefault();
  event.returnValue = "";
};

// The report page
export const Report = () => {
  const [recentIssues, setRecentIssues] = useState<IssueActivityPair[]>([]);
  const [filteredRecents, setFilteredRecents] = useState<IssueActivityPair[]>(
    []
  );
  const [favorites, setFavorites] = useState<IssueActivityPair[]>([]);
  const [hidden, setHidden] = useState<IssueActivityPair[]>([]);
  const [timeEntries, setTimeEntries] = useState<FetchedTimeEntry[]>([]);
  const [newTimeEntries, setNewTimeEntries] = useState<TimeEntry[]>([]);
  const [toastList, setToastList] = useState<ToastMsg[]>([]);
  const [weekTravelDay, setWeekTravelDay] = useState<Date>(new Date());
  const [currentWeekArray, setCurrentWeekArray] = useState(
    getFullWeek(new Date())
  );
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const context = React.useContext(AuthContext);
  const urlparams = useParams();

  // Effect only run on first render to check if the user has entered
  // a valid year and week in URL.
  useEffect(() => {
    // Take today's date as default.
    let day = new Date();

    // Check if the URL contains a valid year and week number
    // If yes, use that for the date.
    // If not, display a warning message and revert to current year/week.
    const yearnum = Number(urlparams.year);
    const weeknum = Number(urlparams.week);
    if (
      !isNaN(yearnum) &&
      yearnum > 0 &&
      !isNaN(weeknum) &&
      weeknum >= 1 &&
      weeknum <= 53
    ) {
      day = setISOWeek(new Date(yearnum, 7, 7), weeknum);
    } else {
      setToastList([
        ...toastList,
        {
          type: "warning",
          timeout: 10000,
          message: "Invalid year or week in URL. Reverting to today.",
        },
      ]);
    }

    // Update "time travel variables" with the resulting date.
    setWeekTravelDay(day);
    setCurrentWeekArray(getFullWeek(day));
  }, []);

  const toggleLoadingPage = (state: boolean) => {
    setIsLoading(state);
  };

  // Retrieve time entries via api
  const getTimeEntries = async (rowTopic: IssueActivityPair, days: Date[]) => {
    let queryparams = new URLSearchParams({
      issue_id: `${rowTopic.issue.id}`,
      activity_id: `${rowTopic.activity.id}`,
      from: formatDate(days[0], dateFormat),
      to: formatDate(days[4], dateFormat),
    });
    let entries: { time_entries: FetchedTimeEntry[] } = await getApiEndpoint(
      `/api/time_entries?${queryparams}`,
      context
    );
    if (entries) return entries.time_entries;
    return null;
  };

  // Retrieve time entries for given rows
  const getAllEntries = async (rows: IssueActivityPair[]) => {
    let allEntries = [];
    for await (let row of rows) {
      const entries = await getTimeEntries(row, currentWeekArray);
      allEntries.push(...entries);
    }
    setTimeEntries(allEntries);
  };

  // If weekTravelDay changes, do this...
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

  // If recentIssues has changed, do this...
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
          getAllEntries([...favorites, ...hidden, ...nonPrioIssues]);
          setFilteredRecents(nonPrioIssues);
          setFavorites(favorites);
          setHidden(hidden);
        }
      } else if (!didCancel) {
        getAllEntries(issues);
        setFilteredRecents(issues);
      }
    };
    getRowData();
    return () => {
      didCancel = true;
    };
  }, [recentIssues]);

  // If the newTimeEntries have changed...
  React.useEffect(() => {
    window.removeEventListener("beforeunload", beforeUnloadHandler, true);
    if (newTimeEntries.length > 0) {
      window.addEventListener("beforeunload", beforeUnloadHandler, true);
    }
  }, [newTimeEntries]);

  React.useEffect(() => {
    if (newTimeEntries.length > 0) {
      setShowUnsavedWarning(true);
    } else {
      setShowUnsavedWarning(false);
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

  // Save which issues that have favorite status
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

  // Toggle favorite status for an issue-activity pair
  const handleToggleFav = async (topic: IssueActivityPair) => {
    // Check if topic is hidden. If yes, make it a favorite.
    const existingHidden = hidden.find(
      (hidden) =>
        hidden.activity.id === topic.activity.id &&
        hidden.issue.id === topic.issue.id
    );
    if (!!existingHidden) {
      const shortenedHidden = removeIssueActivityPair([...hidden], topic);
      topic.is_hidden = false;
      const saved = await saveFavorites([...favorites, ...hidden, topic]);
      if (!saved) {
        console.log("Something went wrong with adding a favorite!");
        return;
      }
      setFavorites([...favorites, topic]);
      setHidden(shortenedHidden);
      return;
    }
    // Topic was not hidden. Check if it is a favorite.
    const existingFav = favorites.find(
      (fav) =>
        fav.activity.id === topic.activity.id && fav.issue.id === topic.issue.id
    );
    // If it is not a favorite, make it one and remove it from recents.
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
    }
    // Topic was a favorite. Remove it from favorites and make it a recent.
    else {
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

  // Enable hiding an issue-activity pair from the list of recent issues
  const toggleHide = async (topic: IssueActivityPair) => {
    // Check if topic is hidden.
    const existingHidden = hidden.find(
      (hidden) =>
        hidden.activity.id === topic.activity.id &&
        hidden.issue.id === topic.issue.id
    );
    // If not, make it a hidden and remove from recent.
    if (!existingHidden) {
      topic.is_hidden = true;
      topic.custom_name = `${topic.issue.subject} - ${topic.activity.name}`;
      const saved = await saveFavorites([...favorites, topic, ...hidden]);
      if (!saved) {
        console.log("Something went wrong with hiding the row");
        return;
      } else {
        const newRecents = removeIssueActivityPair([...filteredRecents], topic);
        setFilteredRecents(newRecents);
        setHidden([topic, ...hidden]);
      }
    }
    // If yes, remove it from hidden and add to recent.
    else {
      const shortenedHidden = removeIssueActivityPair([...hidden], topic);
      const saved = await saveFavorites([...favorites, ...shortenedHidden]);
      if (!saved) {
        console.log("Something went wrong with unhiding the row");
        return;
      } else {
        topic.is_hidden = false;
        setFilteredRecents([...filteredRecents, topic]);
        setHidden(shortenedHidden);
      }
    }
  };

  // Try to ...
  const reportTime = async (timeEntry: TimeEntry) => {
    let logout = false;
    const saved = await fetch(`${SNOWPACK_PUBLIC_API_URL}/api/time_entries`, {
      body: JSON.stringify({ time_entry: timeEntry }),
      method: "POST",
      headers: headers,
    })
      .then((response) => {
        if (response.ok) {
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

  // Check for ...
  const handleSave = async () => {
    setShowUnsavedWarning(false);
    if (newTimeEntries.length === 0) {
      alert(
        "You haven't added, edited or deleted any time entries yet, so nothing could be saved."
      );
      return;
    }
    toggleLoadingPage(true);
    const unsavedEntries = [];
    for await (let entry of newTimeEntries) {
      const saved = await reportTime(entry);
      if (!saved) {
        unsavedEntries.push(entry);
      }
    }
    await getAllEntries([...favorites, ...hidden, ...filteredRecents]);
    setNewTimeEntries(unsavedEntries);
    toggleLoadingPage(false);
    if (unsavedEntries.length === 0) {
      setToastList([
        ...toastList,
        {
          type: "success",
          timeout: 3000,
          message: "All changes saved!",
        },
      ]);
    } else if (unsavedEntries.length > 0) {
      setShowUnsavedWarning(true);
    }
  };

  const handleCloseToast = (index: number) => {
    const toasts = [...toastList];
    toasts.splice(index, 1);
    setToastList(toasts);
    return;
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
  const findRowHours = (rowTopic: IssueActivityPair) => {
    let rowHours = [];
    currentWeekArray.map((day) => {
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
  const findRowEntries = (rowTopic: IssueActivityPair, days: Date[]) => {
    let entries = [];
    days.map((day) => {
      let entry = timeEntries?.find(
        (entry) =>
          entry.spent_on === formatDate(day, dateFormat) &&
          entry.issue.id === rowTopic.issue.id &&
          entry.activity.id === rowTopic.activity.id
      )!;
      entries.push(entry);
    });
    return entries;
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
    const sum = findRowHours(pair).reduce(
      (previousValue, currentValue) => previousValue + currentValue,
      0
    );
    return sum;
  };

  // Removes an IssueActivityPair object from an array of these objects.
  // Returns the shortened array.
  const removeIssueActivityPair = (
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

  if (context.user === null) return <></>;

  // Main content
  return (
    <>
      <LoadingOverlay
        active={isLoading}
        className={isLoading ? "loading-overlay" : ""}
        spinner={
          <ClimbingBoxLoader
            color="hsl(76deg 55% 53%)"
            loading={isLoading}
            size={15}
            width={4}
            height={6}
            radius={4}
            margin={4}
          ></ClimbingBoxLoader>
        }
      >
        <header className="usr-header">
          <h1 className="header-year">
            {getISOWeekYear(weekTravelDay).toString()}
          </h1>
          <TimeTravel
            weekTravelDay={weekTravelDay}
            onWeekTravel={handleWeekTravel}
            currentWeekArray={currentWeekArray}
          />
          <HeaderUser username={context.user ? context.user.login : ""} />
        </header>
        <main className="spreadsheet">
          {favorites && favorites.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <section className="favorites-container">
                <HeaderRow days={currentWeekArray} />
                <Droppable droppableId="favorites">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {favorites &&
                        favorites.map((fav, index) => {
                          const rowEntries = findRowEntries(
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
                                    rowHours={findRowHours(fav)}
                                    rowEntries={rowEntries}
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
                const rowEntries = findRowEntries(
                  recentIssue,
                  currentWeekArray
                );
                return (
                  <Row
                    key={`${recentIssue.issue.id}${recentIssue.activity.id}`}
                    topic={recentIssue}
                    onCellUpdate={handleCellUpdate}
                    onToggleFav={handleToggleFav}
                    onToggleHide={toggleHide}
                    days={currentWeekArray}
                    rowHours={findRowHours(recentIssue)}
                    rowEntries={rowEntries}
                    getRowSum={getRowSum}
                  />
                );
              })}
            <button
              onClick={() => setShowHidden(!showHidden)}
              className="basic-button hide-button"
            >
              {showHidden ? "Collapse hidden rows" : "Show hidden rows"}
              <img src={showHidden ? up : down} alt="" />
            </button>
          </section>
          {showHidden && (
            <section className="recent-container">
              {hidden &&
                hidden.map((hiddenIssue) => {
                  const rowEntries = findRowEntries(
                    hiddenIssue,
                    currentWeekArray
                  );
                  return (
                    <Row
                      key={`${hiddenIssue.issue.id}${hiddenIssue.activity.id}`}
                      topic={hiddenIssue}
                      onCellUpdate={handleCellUpdate}
                      onToggleFav={handleToggleFav}
                      onToggleHide={toggleHide}
                      days={currentWeekArray}
                      rowHours={findRowHours(hiddenIssue)}
                      rowEntries={rowEntries}
                      getRowSum={getRowSum}
                      isHidden={true}
                    />
                  );
                })}
            </section>
          )}
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
                        aria-label={`total of hours spent during the day ${dateStr}`}
                        type="text"
                        id={dateStr}
                        className="cell"
                        value={getTotalHours(dateStr)}
                        readOnly
                        tabIndex={-1}
                      />
                    </div>
                  );
                })}
              <div className="col-1 cell-container">
                <div className="comment-container">
                  <input
                    aria-label="total of hours spent during the week"
                    type="text"
                    className="cell"
                    value={getTotalHoursWeek()}
                    readOnly
                    tabIndex={-1}
                  />
                  {/* Only show warnings for weeks that have passed. 
                    It must be at least Saturday. */}
                  {isPast(addDays(currentWeekArray[4], 1)) && (
                    <img
                      src={getTotalHoursWeek() === 40 ? check : warning}
                      alt={
                        getTotalHoursWeek() === 40
                          ? "check: 40 hours logged this week"
                          : "warning: less or more than 40 hours logged this week"
                      }
                      className={
                        getTotalHoursWeek() === 40
                          ? "feedback-check"
                          : "feedback-warning"
                      }
                      title={
                        getTotalHoursWeek() === 40
                          ? "40 hours logged"
                          : "less or more than 40 hours logged"
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
        <div className="footer">
          <section className="footer-container">
            <div className="col-8">
              <QuickAdd addIssueActivity={addIssueActivityHandler}></QuickAdd>
            </div>
            {toastList.length > 0 && (
                <Toast onCloseToast={handleCloseToast} toastList={toastList} />
              )}
            <div className="col-4 save-changes">
            <div className="unsaved-alert-p">
              {showUnsavedWarning && (
                
                  <p role="status">⚠ You have unsaved changes</p>
                
              )}
              </div>
              <button className="basic-button save-button" onClick={handleSave}>
                Save changes
              </button>
            </div>
          </section>
        </div>
      </LoadingOverlay>
    </>
  );
};
