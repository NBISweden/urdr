import React from "react";
import { RecentIssue, TimeEntry } from "../pages/Report";
import { Cell } from "./Cell";

export const Row = ({
  recentIssue,
  days,
  userId,
  onCellUpdate,
}: {
  recentIssue: RecentIssue;
  days: Date[];
  userId: number;
  onCellUpdate: (timeEntry: TimeEntry) => void;
}) => {
  return (
    <>
      <div className="row issue-row">
        <p className="col-6 issue-label">
          {recentIssue.issue.subject} - {recentIssue.activity.name}
        </p>
        {days.map((day) => {
          return (
            <Cell
              key={`${recentIssue.issue.id}${
                recentIssue.activity.id
              }${day.toISOString()}`}
              recentIssue={recentIssue}
              date={day}
              onCellUpdate={onCellUpdate}
              userId={userId}
            />
          );
        })}
      </div>
    </>
  );
};
