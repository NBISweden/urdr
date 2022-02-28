import React from "react";
import { recentIssue, TimeEntry } from "../pages/Report";
import { Cell } from "./Cell";

export const Row = ({
  recentIssue,
  onCellUpdate,
}: {
  recentIssue: recentIssue;
  onCellUpdate: (timeEntry: TimeEntry) => void;
}) => {
  const today = new Date();
  return (
    <>
      <div>
        <p>
          {recentIssue.name} - {recentIssue.activity.name}
        </p>
        <Cell
          recentIssue={recentIssue}
          date={today}
          onCellUpdate={onCellUpdate}
        />
      </div>
    </>
  );
};
