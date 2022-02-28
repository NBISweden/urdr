import React from "react";
import { recentIssue } from "../pages/Report";

export const Row = ({ recentIssue }: { recentIssue: recentIssue }) => {
  return (
    <>
      <div>
        <p>
          {recentIssue.name} - {recentIssue.activity.name}
        </p>
      </div>
    </>
  );
};
