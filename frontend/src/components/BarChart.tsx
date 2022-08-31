import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../components/AuthProvider";
import { getTimeEntries } from "../utils";
import { FetchedTimeEntry } from "../model";
import { Tooltip } from "./Tooltip";

export const BarChart = ({ loading }: { loading: boolean }) => {
  const [spentTime, setSpentTime] = useState<{
    [key: string]: { hours: number; name: string };
  }>({});
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
    setSpentTime({ Loading: { hours: 0, name: "" } });
    const timeEntries = await getTimeEntries(
      undefined,
      startDate,
      today,
      context
    );
    let activityHours: { [key: string]: { hours: number; name: string } } = {};
    timeEntries.map((entry: FetchedTimeEntry) => {
      // Don't show Absence
      if (entry.activity.id === 19) {
        return;
      }
      if (!activityHours[entry.activity.id]) {
        activityHours[entry.activity.id] = {
          hours: 0,
          name: entry.activity.name,
        };
      }
      activityHours[entry.activity.id].hours += entry.hours;
    });
    setSpentTime(activityHours);
  };

  useEffect(() => {
    const allActivities = Object.values(spentTime);
    let total = 0;
    allActivities.forEach((entry) => (total += entry.hours));
    setTotal(total);
  }, [spentTime]);

  const getPercent = (value: number) => {
    return Math.round((value / total) * 100);
  };

  const colorScheme: { [key: string]: string } = {
    18: "hsl(0deg 0% 75%)", // Administration
    33: "hsl(185deg 24% 80%)", // Consultation
    84: "hsl(76deg 55% 65%)", // Consultation (DM)
    20: "hsl(185deg 24% 60%)", // Core Facility Support
    8: "hsl(186deg 30% 86%)", // Design
    9: "hsl(26deg 91% 65%)", // Development
    14: "hsl(291deg 13% 81%)", // Implementation
    34: "hsl(0deg 0% 83%)", // Internal consultation
    35: "hsl(76deg 55% 77%)", // Internal NBIS
    104: "hsl(26deg 91% 54%)", // NBIS management
    12: "hsl(27deg 91% 77%)", // Presenting (outreach)
    10: "hsl(288deg 13% 61%)", // Professional Development
    11: "hsl(186deg 30% 60%)", // Teaching
    13: "hsl(76deg 55% 53%)", // Support
    85: "hsl(291deg 13% 90%)", // Support (DM)
  };

  return (
    <section className="overview-wrapper">
      <h2 className="overview-heading">This year's work</h2>
      <div className="bar-chart-wrapper">
        {Object.keys(spentTime).length === 0 ? (
          <div className="bar-chart-section">
            Nothing to display - you haven't logged any time yet.
          </div>
        ) : Object.keys(spentTime).includes("Loading") ? (
          <div className="bar-chart-section">Loading...</div>
        ) : (
          Object.keys(spentTime).map((key, index) => {
            // If the number of hours is so low that the width would be rounded down to 0%,
            // make it a thin slice anyway to show that it's there
            const width =
              getPercent(spentTime[key].hours) > 0
                ? `${getPercent(spentTime[key].hours)}%`
                : "4px";

            return (
              <div
                key={spentTime[key].name}
                style={{
                  width: width,
                  backgroundColor: `${
                    colorScheme[key] ? colorScheme[key] : "hsl(291deg 13% 90%)"
                  }`,
                  borderRadius: `${
                    index === 0
                      ? "4px 0 0 4px"
                      : index === Object.keys(spentTime).length - 1
                      ? "0 4px 4px 0"
                      : "0"
                  }`,
                }}
                className="bar-chart-section"
              >
                <Tooltip
                  content={
                    <>
                      <p>{spentTime[key].name}</p>
                      <p>
                        {spentTime[key].hours}h,{" "}
                        {getPercent(spentTime[key].hours)}%
                      </p>
                    </>
                  }
                >
                  <div style={{ width: "100%", overflow: "hidden" }}>
                    <p>{spentTime[key].name}</p>
                    <p>
                      {spentTime[key].hours}h,{" "}
                      {getPercent(spentTime[key].hours)}%
                    </p>
                  </div>
                </Tooltip>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
