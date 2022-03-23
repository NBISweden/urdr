import React from "react";

export const QuickAdd = () => {
  return (
    <div className="row">
      <h2>Quick add:</h2>
      <input
        className="col-2 issue-label"
        type="number"
        min={0}
        onChange={(event: any) => {
          console.log(event);
        }}
        placeholder="Type issue number..."
      />

      <select className="col-3" name="activity" id="activity-select">
        <option value="id-A">Activity A</option>
        <option value="id-B">Activity B</option>
      </select>
      <button className="basic-button col-1">+</button>
    </div>
  );
};
