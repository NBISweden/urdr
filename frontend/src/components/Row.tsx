import React from "react";
import { FetchedTimeEntry, IssueActivityPair, TimeEntry } from "../model";
import { format as formatDate } from "date-fns";

import { Cell } from "./Cell";
import fillStar from "../icons/star-fill.svg";
import star from "../icons/star.svg";
import grip from "../icons/grip-vertical.svg";
import x from "../icons/x.svg";
import { dateFormat } from "../utils";
import { SNOWPACK_PUBLIC_REDMINE_URL } from "../utils";

export const Row = ({
  topic,
  days,
  rowHours,
  rowEntries,
  onCellUpdate,
  onToggleFav,
  onHide,
  getRowSum,
  isFav,
}: {
  topic: IssueActivityPair;
  days: Date[];
  rowHours: number[];
  rowEntries: FetchedTimeEntry[];
  onCellUpdate: (timeEntry: TimeEntry) => void;
  onToggleFav: (topic: IssueActivityPair) => void;
  getRowSum: (pair: IssueActivityPair) => number;
  onHide?: (topic: IssueActivityPair) => void;

  isFav: boolean;
}) => {
  // State var for setting the className of the row depending on focus
  const [rowClass, setRowClass] = React.useState("row");

  const onFocusRow = () => {
    setRowClass("row row-focused");
  };

  const onBlurRow = () => {
    setRowClass("row");
  };

  return (
    <>
      <div className={rowClass}>
        <div className="col-1 cell-container grip-container">
          {isFav ? (
            <img src={grip} className="grip" alt="grip to change row sorting" />
          ) : (
            <button
              type="button"
              className="star-button"
              onClick={() => onHide(topic)}
            >
              <img
                src={x}
                className="hide-icon"
                role="button"
                alt={"Hide this row"}
                title={"Hide this row"}
              />
            </button>
          )}
          <button
            type="button"
            className="star-button"
            onClick={() => onToggleFav(topic)}
          >
            <img
              src={isFav ? fillStar : star}
              className="star-icon"
              role="button"
              alt={isFav ? "Remove from favorites" : "Make favorite"}
              title={isFav ? "Remove from favorites" : "Make favorite"}
            />
          </button>
        </div>
        <div className="col-5 ">
          <div className="issue-label">
            <p className="issue-label-text">
              <a
                href={
                  `${SNOWPACK_PUBLIC_REDMINE_URL}` + `/issues/${topic.issue.id}`
                }
              >{`# ${topic.issue.id}`}</a>
            </p>
            <p className="issue-label-text">
              {topic.custom_name
                ? `${topic.custom_name}`
                : `${topic.issue.subject} - ${topic.activity.name}`}
            </p>
          </div>
        </div>
        {days.map((day, i) => {
          return (
            <Cell
              key={`${topic.issue.id}${topic.activity.id}${formatDate(
                day,
                dateFormat
              )}`}
              topic={topic}
              date={day}
              onCellUpdate={onCellUpdate}
              hours={rowHours[i]}
              comments={rowEntries[i] ? rowEntries[i].comments : ""}
              entryId={rowEntries[i] ? rowEntries[i].id : 0}
              onFocusRow={onFocusRow}
              onBlurRow={onBlurRow}
            />
          );
        })}
        <div className="col-1 cell-container">
          <input
            type="text"
            aria-label={`total of hours spent on the issue ${topic.issue.id}, ${topic.issue.subject}, on the activity ${topic.activity.name}`}
            id={`${topic.issue.id}${topic.activity.id}-total`}
            className="cell not-outline"
            value={getRowSum(topic)}
            readOnly
            onFocus={onFocusRow}
            onBlur={onBlurRow}
          />
        </div>
      </div>
    </>
  );
};
