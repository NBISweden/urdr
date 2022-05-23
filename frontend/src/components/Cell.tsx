import React, { useState } from "react";
import { IssueActivityPair, TimeEntry } from "../model";
import { format as formatDate } from "date-fns";
import { dateFormat } from "../utils";
import x from "../icons/x.svg";

export const Cell = ({
  topic,
  date,
  hours,
  comments,
  entryId,
  onCellUpdate,
  onFocusRow,
  onBlurRow,
}: {
  topic: IssueActivityPair;
  date: Date;
  hours: number;
  comments: string;
  entryId: number;
  onCellUpdate: (timeEntry: TimeEntry) => void;
  onFocusRow: () => void;
  onBlurRow: () => void;
}) => {
  const [showCommentArea, setShowCommentArea] = useState<boolean>(false);
  const [areaComments, setAreaComments] = useState<string>(null);
  const onCommentButtonClick = () => {
    setShowCommentArea(true);
  };
  const onCommentUpdate = (e: any) => {
    setAreaComments(e.target.value);
    onCellUpdate({
      id: entryId,
      issue_id: topic.issue.id,
      activity_id: topic.activity.id,
      hours: hours,
      comments: e.target.value,
      spent_on: formatDate(date, dateFormat),
    });
  };
  const onDeleteCellEntry = (e: any) => {
    {
      if (e.key === "Backspace") {
        onCellChange(e);
      } else if (e.key === "Delete") {
        onCellChange(e);
      }
    }
  };
  const onEscapeArea = (e: any) => {
    {
      if (e.key === "Escape") {
        setShowCommentArea(false);
      }
    }
  };
  const onCellChange = (event: any) => {
    //makes sure that users can only input positive numbers up to 999.99999999...
    //with an unlimited number of decimals behind the delimiter
    event.target.value = event.target.value
      .replace(/[^0-9.]/g, "")
      .replace(/^(\d{3})\d+/, "$1")
      .replace(/(\.\d{2}).*$/, "$1")
      .replace(/(\..*?)\..*/, "$1");

    onCellUpdate({
      id: entryId,
      issue_id: topic.issue.id,
      activity_id: topic.activity.id,
      hours: event.target.value === "" ? 0 : parseFloat(event.target.value),
      comments: comments,
      spent_on: formatDate(date, dateFormat),
    });
  };
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
      <div className="comment-container">
        <input
          type="text"
          id={`${topic.issue.id}${topic.activity.id}${formatDate(
            date,
            "yyyy-MM-dd"
          )}`}
          onChange={onCellChange}
          onKeyUp={onDeleteCellEntry}
          onFocus={onFocusRow}
          onBlur={onBlurRow}
          className="cell"
          defaultValue={hours === 0 ? "" : hours}
        />
        {hours > 0 && (
          <button
            className={comments === "" ? "comment comment-unfilled" : "comment"}
            type="button"
            title="Toggle comment area"
            onFocus={onFocusRow}
            onClick={() => onCommentButtonClick()}
          ></button>
        )}
        {showCommentArea && (
          <div className="area-container col-2">
            <label htmlFor="comments" hidden={true}></label>
            <textarea
              autoFocus
              className="comment-area"
              onChange={onCommentUpdate}
              placeholder="Comments"
              name="comments"
              rows={2}
              maxLength={1000}
              onKeyUp={onEscapeArea}
              onFocus={onFocusRow}
              onBlur={() => setShowCommentArea(false)}
              defaultValue={areaComments !== null ? areaComments : comments}
            />
            <button
              className="close-btn"
              title="Close comment area"
              type="button"
              onClick={() => onCommentButtonClick()}
            >
              <img
                src={x}
                role="button"
                alt="Close comment area"
                aria-label="Button for hiding comment area"
                className="close-img"
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
