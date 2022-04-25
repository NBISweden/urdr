import { format as formatDate } from "date-fns";
import React from "react";
import { TimeEntry } from "../model";

export const DateSumCell = ({
  date,
  timeEntries,
}: {
  date: string;
  timeEntries: TimeEntry[];
}) => {
  const getHours = (date: string) => {
    let count: number = 0;
    timeEntries.map((entry) => {
      if (entry.hours && entry.spent_on === date) count += entry.hours;
    });
    return count;
  };

  return (
    <div className="col-1 cell-container">
      <input
        type="text"
        id={date}
        className="cell"
        value={getHours(date)}
        disabled
      />
    </div>
  );
};
