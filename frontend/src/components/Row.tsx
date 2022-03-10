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
  let headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  const getTimeEntries = async (
    issueId: number,
    activityId: number,
    startDate: string,
    endDate: string
  ) => {
    let entries: FetchedTimeEntry[] = await fetch(
      "http://localhost:8080/api/spent_time",
      {
        method: "GET",
        credentials: "include",
        headers: headers,
        //we somehow need to send id's and date's here
      }
    )
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("Could not get time entries.");
        }
      })
      .catch((error) => console.log(error));
    setRowEntries(entries);
  };

  const findCurrentHours = (day: Date) => {
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
  return (
    <>
      <div className="row issue-row">
        <div className="col-6 ">
          <p className="issue-label">
            {recentIssue.issue.subject} - {recentIssue.activity.name}
          </p>
        </div>
        {days.map((day) => {
          const hours = findCurrentHours(day);
          const id = findEntryId(day);
          return (
            <Cell
              key={`${recentIssue.issue.id}${
                recentIssue.activity.id
              }${day.toISOString()}`}
              recentIssue={recentIssue}
              date={day}
              onCellUpdate={onCellUpdate}
              userId={userId}
              hours={hours}
              entryId={id}
            />
          );
        })}
      </div>
    </>
  );
};
