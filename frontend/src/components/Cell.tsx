import React, { useState } from "react";
import { recentIssue, TimeEntry } from "../pages/Report";

export const Cell = ({
  recentIssue,
  date,
  onCellUpdate,
}: {
  recentIssue: recentIssue;
  date: Date;
  onCellUpdate: (timeEntry: TimeEntry) => void;
}) => {
  const passTimeEntry = (hours: number) => {
    let newEntry: TimeEntry = {
      issueId: recentIssue.id,
      activityId: recentIssue.activity.id,
      hours: hours,
      comments: "",
      spentOn: date,
      userId: 232,
    };
    onCellUpdate(newEntry);
  };
  return (
    <>
      <label
        htmlFor={`${recentIssue.id}${recentIssue.activity.id}`}
        hidden={true}
      >
        Time spent on {`${recentIssue.name} ${recentIssue.activity.name}`}
        on {`${date}`}
      </label>
      <input
        type="number"
        id={`${recentIssue.id}${recentIssue.activity.id}`}
        min={0}
        onChange={(event: any) => passTimeEntry(+event.target.value)}
      />
    </>
  );
};
