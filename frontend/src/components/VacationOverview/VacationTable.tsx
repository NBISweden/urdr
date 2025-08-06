import React from "react";
import { Group } from "../../model";
import { MonthGroup, WeekInfo } from "./types";
import left from "../../icons/caret-left-fill.svg";
import right from "../../icons/caret-right-fill.svg";

type Props = {
  group?: Group;
  weeks: WeekInfo[];
  monthGroups: MonthGroup[];
  vacationData: { [userId: string]: number[] };
  startDate: Date;
  onStartDateChange: (newDate: Date) => void;
};

export const VacationTable: React.FC<Props> = ({
  group,
  weeks,
  monthGroups,
  vacationData,
  startDate,
  onStartDateChange,
}) => {
  const handleWeekBack = () => {
    const newDate = new Date(startDate.getTime());
    newDate.setDate(newDate.getDate() - 7);
    onStartDateChange(newDate);
    return;
  };

  const handleWeekForward = () => {
    const newDate = new Date(startDate.getTime());
    newDate.setDate(newDate.getDate() + 7);
    onStartDateChange(newDate);
    return;
  };

  return (
    <div className="table-wrapper">
      <table className="vacation-table table-responsive">
        <thead>
          {/* Months */}
          <tr>
            <th></th>
            {monthGroups.map((month) => (
              <th key={month.name} colSpan={month.colSpan}>
                {month.name}
              </th>
            ))}
          </tr>

          {/* Weeks */}
          <tr>
            <th>
              <button onClick={handleWeekBack}>
                <img
                  src={left}
                  alt="show one week earlier"
                  className="week-arrow"
                />
              </button>
            </th>
            {weeks.map((week) => (
              <th key={week.week} className="week-header">
                <div> {week.week} </div>
                <div>{week.dateRange}</div>
              </th>
            ))}
            <th className="right-header">
              <button onClick={handleWeekForward}>
                <img
                  src={right}
                  alt="show one week later"
                  className="week-arrow"
                />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {group &&
            group.users
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((user) => (
                <tr key={user.id}>
                  <td className="user-name">{user.name}</td>
                  {weeks.map((week) => {
                    const hasVacation = vacationData[user.id]?.includes(
                      week.week
                    );
                    return (
                      <td
                        key={week.week}
                        className={hasVacation ? "vacation-cell" : ""}
                      ></td>
                    );
                  })}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};
