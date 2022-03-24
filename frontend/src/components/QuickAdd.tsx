import React from "react";
import plus from "../icons/plus.svg";

export const QuickAdd = () => {
  return (
    <div className="row">
      <h2>Quick add:</h2>
      <label htmlFor="input-issue" className="accessibility-label">
        Issue
      </label>
      <input
        id="input-issue"
        className="col-2 issue-label"
        type="number"
        min={0}
        onChange={(event: any) => {
          console.log(event);
        }}
        placeholder="Type issue number..."
      />
      <label htmlFor="select-activity" className="accessibility-label">
        Activity
      </label>
      <select className="col-3" name="activity" id="select-activity">
        <option value="id-A">Activity A</option>
        <option value="id-B">Activity B</option>
      </select>
      <button className=" basic-button plus-button">
        <img src={plus} />
      </button>
    </div>
  );
};
