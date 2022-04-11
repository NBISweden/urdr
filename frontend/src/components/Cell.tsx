import React from "react";
import { IssueActivityPair, TimeEntry } from "../model";
import { format as formatDate } from "date-fns";

export const Cell = ({
  topic,
  date,
  hours,
  entryId,
  onCellUpdate,
}: {
  topic: IssueActivityPair;
  date: Date;
  hours: number;
  entryId: number;
  onCellUpdate: (timeEntry: TimeEntry) => void;
}) => {
  return (
    <div className="col-1 cell-container">
      <label
        htmlFor={`${topic.issue.id}${topic.activity.id}${formatDate(
          date,
          "yyyy-MM-dd"
        )}`}
        hidden={true}
      >
        Time spent on {`${topic.issue.subject} ${topic.activity.name}`}
        on {`${date}`}
      </label>
      <input
        type="number"
        id={`${topic.issue.id}${topic.activity.id}${formatDate(
          date,
          "yyyy-MM-dd"
        )}`}
        min={0}
        onChange={(event: any) => {
          onCellUpdate({
            id: entryId,
            issue_id: topic.issue.id,
            activity_id: topic.activity.id,
            hours: +event.target.value,
            comments: "",
            spent_on: formatDate(date, "yyyy-MM-dd"),
          });
        }}
        className="cell"
        value={hours === 0 ? "" : hours}
      />
    </div>
  );
};
