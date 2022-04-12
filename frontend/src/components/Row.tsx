import React, { useState } from "react";
import { IssueActivityPair, TimeEntry, FetchedTimeEntry } from "../model";
import { getApiEndpoint } from "../utils";
import { format as formatDate } from "date-fns";

import { Cell } from "./Cell";
import fillStar from "../icons/star-fill.svg";
import star from "../icons/star.svg";
import grip from "../icons/grip-vertical.svg";

export const Row = ({
  topic,
  days,
  rowUpdates,
  onCellUpdate,
  onToggleFav,
  saved,
  isFav,
}: {
  topic: IssueActivityPair;
  days: Date[];
  rowUpdates: TimeEntry[];
  onCellUpdate: (timeEntry: TimeEntry) => void;
  onToggleFav: (topic: IssueActivityPair) => void;
  saved: boolean;
  isFav: boolean;
}) => {
  const [rowEntries, setRowEntries] = useState<FetchedTimeEntry[]>([]);
  const [rowHours, setRowHours] = useState<number[]>([0, 0, 0, 0, 0]);
  const [rowEntryIds, setRowEntryIds] = useState<number[]>([]);

  let headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  let params = new URLSearchParams({
    issue_id: `${topic.issue.id}`,
    activity_id: `${topic.activity.id}`,
    from: formatDate(days[0], "yyyy-MM-dd"),
    to: formatDate(days[4], "yyyy-MM-dd"),
  });

  const getTimeEntries = async (params: URLSearchParams) => {
    let entries: { time_entries: FetchedTimeEntry[] } = await getApiEndpoint(
      `/api/time_entries?${params}`
    );
    setRowEntries(entries.time_entries);
  };

  React.useEffect(() => {
    getTimeEntries(params);
  }, [saved, days]);

  const findCurrentHours = (day: Date) => {
    let hours = 0;
    let entry: TimeEntry | FetchedTimeEntry = rowUpdates?.find(
      (entry) => entry.spent_on === formatDate(day, "yyyy-MM-dd")
    );
    if (!entry && rowEntries && rowEntries.length > 0) {
      entry = rowEntries?.find(
        (entry) => entry.spent_on === formatDate(day, "yyyy-MM-dd")
      );
    }
    if (entry) {
      hours = entry.hours;
    }
    return hours;
  };

  const findEntryId = (day: Date) => {
    let id = 0;
    let entry = rowEntries?.find(
      (entry) => entry.spent_on === formatDate(day, "yyyy-MM-dd")
    );
    if (entry) {
      id = entry.id;
    }
    return id;
  };

  React.useEffect(() => {
    const hours = days.map((day) => findCurrentHours(day));
    setRowHours(hours);
    const entryIds = days.map((day) => findEntryId(day));
    setRowEntryIds(entryIds);
  }, [rowEntries, rowUpdates]);

  return (
    <>
      <div className="row">
        <div className="col-1 cell-container grip-container">
          {isFav ? <img src={grip} className="grip" /> : <div></div>}
        </div>
        <div className="col-4 ">
          <div className="issue-label">
            <p className="issue-label-text">{`# ${topic.issue.id}`}</p>
            <p className="issue-label-text">
              {topic.custom_name
                ? `${topic.custom_name}`
                : `${topic.issue.subject} - ${topic.activity.name}`}
            </p>
          </div>
        </div>
        <div className="col-1 star-container">
          <button
            type="button"
            className="star-button"
            onClick={() => onToggleFav(topic)}
          >
            <img
              src={isFav ? fillStar : star}
              className="star"
              role="button"
              alt={isFav ? "Remove from favorites" : "Make favorite"}
            />
          </button>
        </div>
        {days.map((day, i) => {
          return (
            <Cell
              key={`${topic.issue.id}${topic.activity.id}${formatDate(
                day,
                "yyyy-MM-dd"
              )}`}
              topic={topic}
              date={day}
              onCellUpdate={onCellUpdate}
              hours={rowHours[i]}
              entryId={rowEntryIds[i]}
            />
          );
        })}
      </div>
    </>
  );
};
