import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../components/AuthProvider";
import { getTimeEntries } from "../utils";
import { FetchedTimeEntry } from "../model";

export const BarChart = () => {
  const [spentTime, setSpentTime] = useState<{ [key: string]: number }>({});
  const [total, setTotal] = useState<number>(0);
  const context = useContext(AuthContext);
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

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

  const colors = [
    "hsl(76deg 55% 53%)",
    "hsl(288deg 13% 61%)",
    "hsl(185deg 24% 80%)",
    "hsl(26deg 91% 65%)",
    "hsl(0deg 0% 75%)",
    "hsl(186deg 30% 60%)",
    "hsl(76deg 55% 77%)",
    "hsl(291deg 13% 81%)",
    "hsl(27deg 91% 77%)",
    "hsl(76deg 55% 65%)",
  ];

  return (
    <section className="overview-wrapper">
      <h2 className="overview-heading">This year's work</h2>
      <div className="bar-chart-wrapper">
        {Object.keys(spentTime).map((key, index) => {
          // If the number of hours is so low that the width would be rounded down to 0%,
          // make it a thin slice anyway to show that it's there
          const width =
            getPercent(spentTime[key]) > 0
              ? `${getPercent(spentTime[key])}%`
              : "4px";
          return (
            <div
              key={spentTime[key]}
              style={{
                width: width,
                backgroundColor: `${colors[index]}`,
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
