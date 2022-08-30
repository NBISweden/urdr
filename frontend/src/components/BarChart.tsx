import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../components/AuthProvider";
import { getTimeEntries } from "../utils";
import { FetchedTimeEntry } from "../model";

export const BarChart = ({ loading }: { loading: boolean }) => {
  const [spentTime, setSpentTime] = useState<{ [key: string]: number }>({});
  const [total, setTotal] = useState<number>(0);
  const context = useContext(AuthContext);
  const today = new Date();
  const startDate = new Date(`January 1, ${today.getFullYear()}`);

  useEffect(() => {
    // Whenever the user has saved changes we want to fetch the year's time entries
    // to immediately show changes in the chart.
    // That is, we fetch everytime loading turns back to false.
    // It's false when the page renders the first time, so we also fetch then.
    if (!loading) {
      getHoursPerActivity();
    }
  }, [loading]);

  const getHoursPerActivity = async () => {
    const timeEntries = await getTimeEntries(
      undefined,
      startDate,
      today,
      context
    );
    let activityHours: { [key: string]: number } = {};
    timeEntries.map((entry: FetchedTimeEntry) => {
      if (entry.activity.name === "Absence (Vacation/VAB/Other)") {
        return;
      }
      if (!activityHours[entry.activity.name]) {
        activityHours[entry.activity.name] = 0;
      }
      activityHours[entry.activity.name] += entry.hours;
    });
    const sortedActivityHours = Object.keys(activityHours)
      .sort()
      .reduce(
        (previousKey, currentKey) => ({
          ...previousKey,
          [currentKey]: activityHours[currentKey],
        }),
        {}
      );
    setSpentTime(sortedActivityHours);
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

  const colorScheme: { [key: string]: string } = {
    Administration: "hsl(0deg 0% 75%)",
    Consultation: "hsl(185deg 24% 80%)",
    "Consultation (DM)": "hsl(76deg 55% 65%)",
    "Core Facility Support": "hsl(185deg 24% 60%) ",
    Design: "hsl(186deg 30% 86%)",
    Development: "hsl(26deg 91% 65%)",
    Implementation: "hsl(291deg 13% 81%)",
    "Internal consultation": "hsl(0deg 0% 83%)",
    "Internal NBIS": "hsl(76deg 55% 77%)",
    "NBIS management": "hsl(26deg 91% 54%)",
    "Presenting (outreach)": "hsl(27deg 91% 77%)",
    "Professional Development": "hsl(288deg 13% 61%)",
    Teaching: "hsl(186deg 30% 60%)",
    Support: "hsl(76deg 55% 53%)",
    "Support (DM)": "hsl(291deg 13% 90%)",
  };

  return (
    <section className="overview-wrapper">
      <h2 className="overview-heading">This year's work</h2>
      <div className="bar-chart-wrapper">
        {Object.keys(spentTime).length > 0 ? (
          Object.keys(spentTime).map((key) => {
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
                  backgroundColor: `${colorScheme[key]}`,
                }}
                className="bar-chart-section"
              >
                <p>{key}</p>
                <p>
                  {spentTime[key]}h, {getPercent(spentTime[key])}%
                </p>
              </div>
            );
          })
        ) : (
          <div className="bar-chart-section">
            Nothing to display - you haven't logged any time yet.
          </div>
        )}
      </div>
    </section>
  );
};
