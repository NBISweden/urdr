import React from "react";
import { RecentIssue, TimeEntry } from "../pages/Report";

export const Cell = ({
  recentIssue,
  date,
  userId,
  onCellUpdate,
}: {
  recentIssue: RecentIssue;
  date: Date;
  userId: number;
  onCellUpdate: (timeEntry: TimeEntry) => void;
}) => {
  const passTimeEntry = (hours: number) => {
    let newEntry: TimeEntry = {
      issue_id: recentIssue.issue.id,
      activity_id: recentIssue.activity.id,
      hours: hours,
      comments: "",
      spent_on: date.toISOString().split("T")[0],
      user_id: userId,
    };
    onCellUpdate(newEntry);
  };
  return (
    <div className="col-1">
      <label
        htmlFor={`${recentIssue.issue.id}${recentIssue.activity.id}`}
        hidden={true}
      >
        Time spent on{" "}
        {`${recentIssue.issue.subject} ${recentIssue.activity.name}`}
        on {`${date}`}
      </label>
      <input
        type="number"
        id={`${recentIssue.issue.id}${recentIssue.activity.id}`}
        min={0}
        onChange={(event: any) => passTimeEntry(+event.target.value)}
        className="cell"
      />
    </div>
  );
};
