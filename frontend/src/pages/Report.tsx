import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  format as formatDate,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
} from "date-fns";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";
import { QuickAdd } from "../components/QuickAdd";
import { Toast } from "../components/Toast";
import { HeaderUser } from "../components/HeaderUser";
import { IssueActivityPair, TimeEntry, FetchedTimeEntry } from "../model";
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

const beforeUnloadHandler = (event) => {
  event.preventDefault();
  event.returnValue = "";
};

// The report page
export const Report = () => {
  const urlparams = useParams();
  let yearweekWarningMessage = "";
  const [recentIssues, setRecentIssues] = useState<IssueActivityPair[]>([]);
  const [filteredRecents, setFilteredRecents] = useState<IssueActivityPair[]>(
    []
  );
  const [favorites, setFavorites] = useState<IssueActivityPair[]>([]);
  const [hidden, setHidden] = useState<IssueActivityPair[]>([]);
  const [timeEntries, setTimeEntries] = useState<FetchedTimeEntry[]>([]);
  const [newTimeEntries, setNewTimeEntries] = useState<TimeEntry[]>([]);

  // Get year/week either from URL parameters or current time.
  // Use today as date if nor year or week are valid numbers.
  // Use flag "yearweekWarning" for indication of error in week/year parameters.
  // When flag is true, display a warning message below the header with year/week.
  let yearweekWarning: boolean = false;
  const thisYear: number = new Date().getFullYear();
  let yearnum: number = Number(urlparams.year);
  if (isNaN(yearnum)) {
    yearnum = thisYear;
    yearweekWarning = true;
  }

  // Assume current week/date
  let today = new Date();
  const thisWeek: number = getISOWeek(new Date());
  let weeknum = thisWeek;

  // If week parameter is a valid number between 1-53, change the "today" value based on year/week.
  // If the year parameter was wrong, ignore the week parameter and use thisWeek.
  weeknum = Number(urlparams.week);
  if (isNaN(weeknum) || yearweekWarning) {
    weeknum = thisWeek;
    yearweekWarning = true;
  } else if (weeknum >= 1 && weeknum <= 53) {
    today = setISOWeek(new Date(yearnum, 7, 7), weeknum);
  } else {
    yearweekWarning = true;
  }
  // Make sure that displayed year matches the year of the "today" variable
  let ycheck = getISOWeekYear(today);
  if (ycheck != yearnum) {
    yearnum = ycheck;
    yearweekWarning = true;
  }

  if (yearweekWarning) {
    yearweekWarningMessage =
      "Invalid year/week in url. Reverting to current year/week.";
  } else {
    yearweekWarningMessage = "";
  }

  // Set weeks for timetravel when weeknum has changed
  React.useEffect(() => {
    setWeekTravelDay(today);
    setCurrentWeekArray(getFullWeek(today));
  }, [weeknum]);

  // Change displayed "Timetravel content" based on found year/week
  const [weekTravelDay, setWeekTravelDay] = useState<Date>(today);
  const [currentWeekArray, setCurrentWeekArray] = useState(getFullWeek(today));
  const [showToast, setShowToast] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const context = React.useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

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

  // Retrieve time entries and recent entries
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

  // Enable hiding an issue-activity pair from the list of recent issues
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
    setShowToast(false);
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
    await getAllEntries(favorites, filteredRecents);
    setNewTimeEntries(unsavedEntries);
    toggleLoadingPage(false);
    if (unsavedEntries.length === 0) {
      setShowToast(true);
    } else if (unsavedEntries.length > 0) {
      setShowUnsavedWarning(true);
    }
  };

  const handleCloseToast = () => {
    setShowToast(false);
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
        className="loading-overlay"
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
        <header>
          <div className="report-header">
            <h1 className="header-year">{yearnum.toString()}</h1>
            <TimeTravel
              weekTravelDay={weekTravelDay}
              onWeekTravel={handleWeekTravel}
              currentWeekArray={currentWeekArray}
            />
            <HeaderUser username={context.user ? context.user.login : ""} />
          </div>
          <p className="header-warning">{yearweekWarningMessage}</p>
        </header>

        <div className="main">
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
                      onHide={handleHide}
                      days={currentWeekArray}
                      rowHours={findRowHours(recentIssue)}
                      rowEntries={rowEntries}
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
                          aria-labelledby={`total of hours spent during the day ${dateStr}`}
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
                    aria-label="total of hours spent during the week"
                    type="text"
                    className="cell not-outline"
                    value={getTotalHoursWeek()}
                    readOnly
                  />
                </div>
              </div>
            </section>
          </main>
        </div>
        <div className="footer">
          <section className="footer-container">
            <div className="col-7">
              <QuickAdd addIssueActivity={addIssueActivityHandler}></QuickAdd>
            </div>
            <div className="col-3 ">
              {showUnsavedWarning && (
                <div className="unsaved-alert-p">
                  <p role="status">⚠ You have unsaved changes</p>
                </div>
              )}
              {showToast && <Toast onCloseToast={handleCloseToast} />}
            </div>
            <div className="col-2 save-changes">
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
