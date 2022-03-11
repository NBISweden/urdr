import React, { useState } from "react";
import { RecentIssue, TimeEntry, FetchedTimeEntry } from "../pages/Report";
import { Cell } from "./Cell";

export const Row = ({
  recentIssue,
  days,
  userId,
  rowUpdates,
  onCellUpdate,
  onReset,
  saved,
}: {
  recentIssue: RecentIssue;
  days: Date[];
  userId: number;
  rowUpdates: TimeEntry[];
  onCellUpdate: (timeEntry: TimeEntry) => void;
  onReset: () => void;
  saved: boolean;
}) => {
  const [rowEntries, setRowEntries] = useState<FetchedTimeEntry[]>([]);
  const [rowHours, setRowHours] = useState<number[]>([0, 0, 0, 0, 0]);
  const [rowEntryIds, setRowEntryIds] = useState<number[]>([]);

  let headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  let params = new URLSearchParams({
    issue_id: `${recentIssue.issue.id}`,
    activity_id: `${recentIssue.activity.id}`,
    start_date: `${days[0].toISOString().split("T")[0]}`,
    end_date: `${days[4].toISOString().split("T")[0]}`,
  });

  const getTimeEntries = async (params: URLSearchParams) => {
    let entries: { time_entries: FetchedTimeEntry[] } = await fetch(
      `http://localhost:8080/api/time_entries?${params}`,
      {
        method: "GET",
        credentials: "include",
        headers: headers,
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
    setTimeout(() => onReset(), 100);
  };

  React.useEffect(() => {
    getTimeEntries(params);
  }, [saved]);

  const findCurrentHours = (day: Date) => {
    let hours = 0;
    let entry: TimeEntry | FetchedTimeEntry = rowUpdates?.find(
      (entry) => entry.spent_on === day.toISOString().split("T")[0]
    );
    if (!entry && rowEntries && rowEntries.length > 0) {
      entry = rowEntries?.find(
        (entry) => entry.spent_on === day.toISOString().split("T")[0]
      );
    }
    if (entry) {
      hours = entry.hours;
    }
    return hours;
  };

  const findEntryId = (day: Date) => {
    let id = 0;
    let entry = rowEntries?.find(
      (entry) => entry.spent_on === day.toISOString().split("T")[0]
    );
    if (entry) {
      id = entry.id;
    }
    return id;
  };

  React.useEffect(() => {
    const hours = days.map((day) => findCurrentHours(day));
    setRowHours(hours);
    const entryIds = days.map((day) => findEntryId(day));
    setRowEntryIds(entryIds);
  }, [rowEntries, rowUpdates]);

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
