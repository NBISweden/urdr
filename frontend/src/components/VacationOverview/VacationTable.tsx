import React from "react";
import { Group } from "../../model";
import { MonthGroup, WeekInfo } from "./types";
import { format, addDays } from "date-fns";

type Props = {
  group?: Group;
  weeks: WeekInfo[];
  monthGroups: MonthGroup[];
  vacationData: { [userId: string]: { [date: string]: "vacation" | "parental" }  };
};

export const VacationTable: React.FC<Props> = ({
  group,
  weeks,
  monthGroups,
  vacationData,
}) => {
  return (
    <div className="table-wrapper">
      <div className="legend">
        <div className="legend-item">
          <span className="legend-label">Vacation</span>
          <span className="legend-color vacation"></span>
        </div>
        <div className="legend-item">
          <span className="legend-label">Parental Leave</span>
          <span className="legend-color parental"></span>
        </div>
      </div>
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
            <th></th>
            {weeks.map((week) => (
              <th key={week.week} className="week-header">
                <div> {week.week} </div>
                <div>{week.dateRange}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group &&
            group.users
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((user) => (
                <tr key={user.id}>
                  <td className="user-name">{user.name}</td>
                  {weeks.map((week) => (
                      <td key={week.week}>
                        <div className="week-day-cell">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const day = addDays(week.monday, i);
                            const dayStr = format(day, "yyyy-MM-dd");
                            const absenceType = vacationData[user.id]?.[dayStr];
                            return (
                                <div
                                    key={i}
                                    className={`day-part ${absenceType === "vacation" ? "vacation" : ""} ${
                                        absenceType === "parental" ? "parental" : ""
                                    }`}
                                    title={`${dayStr}\n${absenceType === "vacation" ? "Vacation" 
                                        : absenceType === "parental" ? "Parental Leave" : ""}`}
                                />
                            );
                          })}
                        </div>
                      </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};
