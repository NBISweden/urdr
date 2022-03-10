import React, { useState } from "react";
import { RecentIssue, TimeEntry, FetchedTimeEntry } from "../pages/Report";
import { Cell } from "./Cell";

export const Row = ({
  recentIssue,
  days,
  userId,
  rowUpdates,
  onCellUpdate,
}: {
  recentIssue: RecentIssue;
  days: Date[];
  userId: number;
  rowUpdates: TimeEntry[];
  onCellUpdate: (timeEntry: TimeEntry) => void;
}) => {
  const [rowEntries, setRowEntries] = useState<FetchedTimeEntry[]>([]);
  const [rowHours, setRowHours] = useState<number[]>([]);
  const [rowEntryIds, setRowEntryIds] = useState<number[]>([]);
  let headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  let params = new URLSearchParams({
    issue_id: `${recentIssue.issue.id}`,
    activity_id: `${recentIssue.activity.id}`,
    start_date: `2022-03-07`,
    end_date: `2022-03-11`,
  });
  const getTimeEntries = async (params: URLSearchParams) => {
    let entries: FetchedTimeEntry[] = await fetch(
      `http://localhost:8080/api/time_entries?${params}`,
      {
        method: "GET",
        credentials: "include",
        headers: headers,
        //we somehow need to send id's and date's here
      }
    )
      .then((res) => {
        if (res.ok) {
          console.log("success");
          return res.json();
        } else {
          throw new Error("Could not get time entries.");
        }
      })
      .catch((error) => console.log(error));
    setRowEntries(entries.time_entries);
  };
  React.useEffect(() => {
    getTimeEntries(params);
  }, []);

  const findCurrentHours = (day: Date) => {
    console.log("finding hours", rowEntries);
    let hours = 0;
    let entry: TimeEntry | FetchedTimeEntry = rowUpdates?.find(
      (entry) => entry.spent_on === day.toISOString().split("T")[0]
    );
    if (!entry) {
      entry = rowEntries?.find(
        (entry) => entry.spent_on === day.toISOString().split("T")[0]
      );
    }
    if (entry) {
      hours = entry.hours;
    }
    return hours;
  };

  React.useEffect(() => {
    console.log("use effect");
    if (rowEntries && rowEntries.length > 0) {
      console.log("if true");
      const hours = days.map((day) => findCurrentHours(day));
      setRowHours(hours);
      const entryIds = days.map((day) => findEntryId(day));
      setRowEntryIds(entryIds);
    }
  }, [rowEntries, rowUpdates]);

  const findEntryId = (day: Date) => {
    console.log("finding entry", rowEntries);
    let id = 0;
    let entry = rowEntries?.find(
      (entry) => entry.spent_on === day.toISOString().split("T")[0]
    );
    if (entry) {
      id = entry.id;
    }
    return id;
  };
  return (
    <>
      <div className="row issue-row">
        <div className="col-6 ">
          <p className="issue-label">
            {recentIssue.issue.subject} - {recentIssue.activity.name}
          </p>
        </div>
        {days.map((day, i) => {
          return (
            <Cell
              key={`${recentIssue.issue.id}${
                recentIssue.activity.id
              }${day.toISOString()}`}
              recentIssue={recentIssue}
              date={day}
              onCellUpdate={onCellUpdate}
              userId={userId}
              hours={rowHours[i]}
              entryId={rowEntryIds[i]}
            />
          );
        })}
      </div>
    </>
  );
};
