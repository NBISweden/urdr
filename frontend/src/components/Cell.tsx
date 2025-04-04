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
        onBlurArea();
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
  // Make sure that the the comment area is not visible and the row is no longer highlighted
  const onBlurArea = () => {
    setShowCommentArea(false);
    onBlurRow();
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
          onChange={(ev) => onCellChange(ev)}
          onKeyUp={(ev) => onDeleteCellEntry(ev)}
          onFocus={() => onFocusRow()}
          onBlur={() => onBlurRow()}
          className="cell"
          defaultValue={hours === 0 ? "" : hours}
          data-no-dnd="true"
        />
        {hours > 0 && (
          <button
            className={comments === "" ? "comment comment-unfilled" : "comment"}
            onBlur={() => onBlurRow()}
            type="button"
            title="Toggle comment area"
            onFocus={() => onFocusRow()}
            onClick={() => onCommentButtonClick()}
            data-no-dnd="true"
          ></button>
        )}
        {showCommentArea && (
          <div className="area-container col-2">
            <label htmlFor="comments" hidden={true}></label>
            <textarea
              autoFocus
              className="comment-area"
              onChange={(ev) => onCommentUpdate(ev)}
              placeholder="Comments"
              name="comments"
              rows={2}
              maxLength={1000}
              onKeyUp={(ev) => onEscapeArea(ev)}
              onFocus={() => onFocusRow()}
              onBlur={() => onBlurArea()}
              defaultValue={areaComments !== null ? areaComments : comments}
              data-no-dnd="true"
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
