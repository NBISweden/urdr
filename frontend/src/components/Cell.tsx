import React from "react";
import { RecentIssue, TimeEntry } from "../pages/Report";

export const Cell = ({
  recentIssue,
  date,
  userId,
  entry,
  onCellUpdate,
}: {
  recentIssue: RecentIssue;
  date: Date;
  userId: number;
  entry: TimeEntry;
  onCellUpdate: (timeEntry: TimeEntry) => void;
}) => {
  return (
    <div className="col-1">
      <label
        htmlFor={`${recentIssue.issue.id}${
          recentIssue.activity.id
        }${date.toISOString()}`}
        hidden={true}
      >
        Time spent on{" "}
        {`${recentIssue.issue.subject} ${recentIssue.activity.name}`}
        on {`${date}`}
      </label>
      <input
        type="number"
        id={`${recentIssue.issue.id}${
          recentIssue.activity.id
        }${date.toISOString()}`}
        min={0}
        onChange={(event: any) => {
          onCellUpdate({
            issue_id: recentIssue.issue.id,
            activity_id: recentIssue.activity.id,
            hours: +event.target.value,
            comments: "",
            spent_on: date.toISOString().split("T")[0],
            user_id: userId,
          });
        }}
        className="cell"
        value={entry?.hours}
      />
    </div>
  );
};
