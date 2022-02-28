import React from "react";
import { recentIssue } from "../pages/Report";

export const Cell = ({
  recentIssue,
  date,
}: {
  recentIssue: recentIssue;
  date: Date;
}) => {
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
      />
    </>
  );
};
