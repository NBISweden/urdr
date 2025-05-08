import React, {useState} from "react";
import {Group} from "../../model";
import {MonthGroup, WeekInfo} from "./types";

type Props = {
    group?: Group;
    weeks: WeekInfo[];
    monthGroups: MonthGroup[];
    vacationData: { [userId: string]: number[] };
};

export const VacationTable: React.FC<Props>  = ({group, weeks, monthGroups, vacationData}) => {
    return (
        <div className="table-wrapper">
            <table className="vacation-table table-responsive" >
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
                {group && group.users.sort((a, b) => a.name.localeCompare(b.name)).map((user) => (
                    <tr key={user.id}>
                        <td className="user-name">{user.name}</td>
                        {weeks.map((week) => {
                            const hasVacation = vacationData[user.id]?.includes(week.week);
                            return (
                                <td
                                    key={week.week}
                                    className={hasVacation ? "vacation-cell" : ""}
                                >
                                </td>
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>

    )
}