import React from "react";
import { IssueActivityPair, TimeEntry } from "../model";

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
    <div className="col-1">
      <label
        htmlFor={`${topic.issue.id}${topic.activity.id}${date.toISOString()}`}
        hidden={true}
      >
        Time spent on {`${topic.issue.subject} ${topic.activity.name}`}
        on {`${date}`}
      </label>
      <input
        type="number"
        id={`${topic.issue.id}${topic.activity.id}${date.toISOString()}`}
        min={0}
        onChange={(event: any) => {
          onCellUpdate({
            id: entryId,
            issue_id: topic.issue.id,
            activity_id: topic.activity.id,
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
