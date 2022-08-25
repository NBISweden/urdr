import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../components/AuthProvider";
import { getTimeEntries } from "../utils";
import { FetchedTimeEntry } from "../model";
import chart from "../images/barchart_mock_notext.png";

export const BarChart = () => {
  const [spentTime, setSpentTime] = useState<{ [key: string]: number }>({});
  const [total, setTotal] = useState<number>(0);
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const context = useContext(AuthContext);

  useEffect(() => {
    getHoursPerActivity();
  }, []);

  const getHoursPerActivity = async () => {
    const timeEntries = await getTimeEntries(
      undefined,
      oneYearAgo,
      today,
      context
    );
    let activityHours: { [key: string]: number } = {};
    timeEntries.map((entry: FetchedTimeEntry) => {
      if (!activityHours[entry.activity.name]) {
        activityHours[entry.activity.name] = 0;
      }
      activityHours[entry.activity.name] += entry.hours;
    });
    setSpentTime(activityHours);
  };

  useEffect(() => {
    const total = Object.values(spentTime).reduce(
      (previousValue, currentValue) => previousValue + currentValue,
      0
    );
    setTotal(total);
  }, [spentTime]);

  const getPercent = (value: number) => {
    return Math.round((value / total) * 100);
  };

  const mockColors = [
    "hotpink",
    "peachpuff",
    "lightgrey",
    "cornflowerblue",
    "coral",
    "yellow",
    "green",
  ];

  return (
    <section className="overview-wrapper">
      <h2 className="overview-heading">This year's work</h2>
      <div className="bar-chart-wrapper">
        {Object.keys(spentTime).map((key, index) => {
          return (
            <div
              style={{
                width: `${getPercent(spentTime[key])}%`,
                backgroundColor: `${mockColors[index]}`,
              }}
              className="bar-chart-section"
            >
              <p>{key}</p>
              <p>
                {spentTime[key]}h, {getPercent(spentTime[key])}%
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
