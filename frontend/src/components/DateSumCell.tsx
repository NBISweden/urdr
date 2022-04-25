import { format as formatDate } from "date-fns";
import React from "react";

export const DateSumCell = ({ date }: { date: Date }) => {
  return (
    <>
      <div className="col-1 cell-container">
        <input
          type="text"
          id={`${formatDate(date, "yyyy-MM-dd")}`}
          className="cell"
          value={0}
        />
      </div>
    </>
  );
};
