import React from "react";
import { recentIssue } from "../pages/Report";
import { Cell } from "./Cell";

export const Row = ({ recentIssue }: { recentIssue: recentIssue }) => {
  const today = new Date();
  return (
    <>
      <div>
        <p>
          {recentIssue.name} - {recentIssue.activity.name}
        </p>
        <Cell recentIssue={recentIssue} date={today} />
      </div>
    </>
  );
};
