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
        <Cell
          recentIssue={recentIssue}
          date={days[0]}
          onCellUpdate={onCellUpdate}
          userId={userId}
        />
      </div>
    </>
  );
};
