import React from "react";
import { recentIssue, TimeEntry } from "../pages/Report";
import { Cell } from "./Cell";

export const Row = ({
  recentIssue,
  days,
  userId,
  onCellUpdate,
}: {
  recentIssue: recentIssue;
  days: Date[];
  userId: number;
  onCellUpdate: (timeEntry: TimeEntry) => void;
}) => {
  return (
    <>
      <div className="row">
        <p className="col-6">
          {recentIssue.name} - {recentIssue.activity.name}
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
