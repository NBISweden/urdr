import React from "react";
import { IssueActivityPair, TimeEntry } from "../model";
import { format as formatDate } from "date-fns";

import { Cell } from "./Cell";
import fillStar from "../icons/star-fill.svg";
import star from "../icons/star.svg";
import grip from "../icons/grip-vertical.svg";
import eye from "../icons/eye-slash.svg";
import { dateFormat } from "../utils";
import { SNOWPACK_PUBLIC_REDMINE_URL } from "../utils";

export const Row = ({
  topic,
  days,
  rowHours,
  rowEntryIds,
  onCellUpdate,
  onToggleFav,
  onHide,
  getRowSum,
  isFav,
}: {
  topic: IssueActivityPair;
  days: Date[];
  rowHours: number[];
  rowEntryIds: number[];
  onCellUpdate: (timeEntry: TimeEntry) => void;
  onToggleFav: (topic: IssueActivityPair) => void;
  getRowSum: (pair: IssueActivityPair) => number;
  onHide?: (topic: IssueActivityPair) => void;

  isFav: boolean;
}) => {
  return (
    <>
      <div className="row">
        <div className="col-1 cell-container grip-container">
          {isFav ? (
            <img src={grip} className="grip" alt="grip to change row sorting" />
          ) : (
            <div></div>
          )}
        </div>
        <div className="col-4 ">
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
          {!isFav ? (
            <button
              type="button"
              className="star-button"
              onClick={() => onHide(topic)}
            >
              <img
                src={eye}
                className="star"
                role="button"
                alt={"Hide this row"}
              />
            </button>
          ) : (
            <></>
          )}
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
              entryId={rowEntryIds[i]}
            />
          );
        })}
        <div className="col-1 cell-container">
          <input
            type="text"
            id={`${topic.issue.id}${topic.activity.id}-total`}
            className="cell not-outline"
            value={getRowSum(topic)}
            readOnly
          />
        </div>
      </div>
    </>
  );
};
