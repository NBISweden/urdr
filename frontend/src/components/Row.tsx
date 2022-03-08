import React from "react";
import { RecentIssue, TimeEntry } from "../pages/Report";
import { Cell } from "./Cell";

export const Row = ({
  recentIssue,
  days,
  userId,
  rowEntries,
  onCellUpdate,
}: {
  recentIssue: RecentIssue;
  days: Date[];
  userId: number;
  rowEntries: TimeEntry[];
  onCellUpdate: (timeEntry: TimeEntry) => void;
}) => {
  return (
    <>
      <div className="row issue-row">
        <p className="col-6 issue-label">
          {recentIssue.issue.subject} - {recentIssue.activity.name}
        </p>
        {days.map((day) => {
          const currentEntry = rowEntries?.find(
            (entry) => entry.spent_on === day.toISOString().split("T")[0]
          );
          return (
            <Cell
              key={`${recentIssue.issue.id}${
                recentIssue.activity.id
              }${day.toISOString()}`}
              recentIssue={recentIssue}
              date={day}
              onCellUpdate={onCellUpdate}
              userId={userId}
              entry={currentEntry}
            />
          );
        })}
      </div>
    </>
  );
};
