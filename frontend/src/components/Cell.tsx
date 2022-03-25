import React from "react";
import { RecentIssue, TimeEntry } from "../model";

export const Cell = ({
  recentIssue,
  date,
  hours,
  entryId,
  onCellUpdate,
}: {
  recentIssue: RecentIssue;
  date: Date;
  hours: number;
  entryId: number;
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
            id: entryId,
            issue_id: recentIssue.issue.id,
            activity_id: recentIssue.activity.id,
            hours: +event.target.value,
            comments: "",
            spent_on: date.toISOString().split("T")[0],
          });
        }}
        className="cell"
        value={hours === 0 ? "" : hours}
      />
    </div>
  );
};
