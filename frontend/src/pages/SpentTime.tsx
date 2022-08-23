import "../index.css";
import React, { useState } from "react";
import { AuthContext } from "../components/AuthProvider";
import { getTimeEntries } from "../utils";
import { FetchedTimeEntry } from "model";

export const SpentTime = () => {
  const [spentTime, setSpentTime] = useState<{}>({});

  React.useEffect(() => {
    getHoursPerActivity();
  }, []);

  const getHoursPerActivity = async () => {
    const timeEntries = await getTimeEntries(
      undefined,
      new Date(2019, 6, 5, 10, 33, 30),
      new Date(),
      context
    );
    let activityHours = {};
    timeEntries.map((entry: FetchedTimeEntry) => {
      activityHours[entry.activity.name]
        ? (activityHours[entry.activity.name] += entry.hours)
        : (activityHours[entry.activity.name] = 0);
      if (activityHours[entry.activity.name] === 0) {
        activityHours[entry.activity.name] += entry.hours;
      }
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
