import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Row } from "../components/Row";
import { HeaderRow } from "../components/HeaderRow";
import { QuickAdd } from "../components/QuickAdd";
import { useNavigate } from "react-router-dom";
import { HeaderUser } from "../components/HeaderUser";
import { User, IssueActivityPair, TimeEntry } from "../model";
import {
  SNOWPACK_PUBLIC_API_URL,
  getApiEndpoint,
  headers,
  getFullWeek,
} from "../utils";
import { TimeTravel } from "../components/TimeTravel";

export const Report = () => {
  const navigate = useNavigate();

  const [recentIssues, setRecentIssues] = useState<IssueActivityPair[]>([]);
  const [filteredRecents, setFilteredRecents] = useState<IssueActivityPair[]>(
    []
  );
  const [favorites, setFavorites] = useState<IssueActivityPair[]>([]);
  const [newTimeEntries, setNewTimeEntries] = useState<TimeEntry[]>([]);
  const [toggleSave, setToggleSave] = useState(false);
  const today = new Date();
  const [weekTravelDay, setWeekTravelDay] = useState<Date>(today);
  const [currentWeekArray, setCurrentWeekArray] = useState(getFullWeek(today));
  let location = useLocation();
  const user: User = location.state as User;

  const getRecentIssuesWithinRange = async () => {
    // Use Friday as limit for the query
    const toDate: String = currentWeekArray[4].toISOString().split("T")[0];
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
        credentials: "include",
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
      getRowTopics();
    } else {
      const favs = [...favorites];
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

  const reportTime = async (timeEntry: TimeEntry) => {
    const saved = await fetch(`${SNOWPACK_PUBLIC_API_URL}/api/time_entries`, {
      body: JSON.stringify({ time_entry: timeEntry }),
      method: "POST",
      credentials: "include",
      headers: headers,
    })
      .then((response) => {
        if (response.ok) {
          console.log("Time reported");
          // alert("Changes saved!");
          return true;
        } else if (response.status === 401) {
          // Redirect to login page
          navigate("/");
        } else {
          throw new Error("Time report failed.");
        }
      })
      .catch((error) => {
        alert(error);
        return false;
      });
    return saved;
  };

  const handleSave = () => {
    const unsavedEntries = [];
    newTimeEntries.forEach(async (entry) => {
      const saved = await reportTime(entry);
      if (!saved) {
        unsavedEntries.push(entry);
        return;
      }
      return;
    });
    setToggleSave(!toggleSave);
    setTimeout(() => {
      setNewTimeEntries(unsavedEntries);
    }, 1000);
  };

  const handleWeekTravel = (newDay: Date) => {
    setWeekTravelDay(newDay);
    setCurrentWeekArray(getFullWeek(newDay));
  const onDragEnd = () => {
    //TODO: Save new list of favorites
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
      <HeaderUser username={user ? user.login : ""} />
      <TimeTravel
        weekTravelDay={weekTravelDay}
        onWeekTravel={handleWeekTravel}
      />
      {favorites.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <section className="recent-container">
            <HeaderRow days={currentWeekArray} title="Favorites" />
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
                                  days={thisWeek}
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
        <HeaderRow
          days={favorites.length > 0 ? [] : currentWeekArray}
          title="Recent issues"
        />
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
