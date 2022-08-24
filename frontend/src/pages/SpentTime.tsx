import "../index.css";
import React, { useState } from "react";
import { AuthContext } from "../components/AuthProvider";
import { getTimeEntries } from "../utils";
import { FetchedTimeEntry } from "model";

export const SpentTime = () => {
  const [spentTime, setSpentTime] = useState<{}>({});
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  React.useEffect(() => {
    getHoursPerActivity();
  }, []);

  const getHoursPerActivity = async () => {
    const timeEntries = await getTimeEntries(
      undefined,
      oneYearAgo,
      today,
      context
    );
    let activityHours = {};
    timeEntries.map((entry: FetchedTimeEntry) => {
      if (!activityHours[entry.activity.name]) {
        activityHours[entry.activity.name] = 0;
      }
      activityHours[entry.activity.name] += entry.hours;
    });
    setSpentTime(activityHours);
  };

  const context = React.useContext(AuthContext);

  return (
    <>
      <header>
        <h1>Spent time</h1>
      </header>
      <main>
        <p>{JSON.stringify(spentTime)}</p>
      </main>
    </>
  );
};
