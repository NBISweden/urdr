import "../index.css";
import React, { useState } from "react";
import { AuthContext } from "../components/AuthProvider";
import { getTimeEntries } from "../utils";
import { FetchedTimeEntry } from "./model";
import { PieChart } from "react-minimal-pie-chart";
import { Data } from "react-minimal-pie-chart/types/commonTypes";

export const SpentTime = () => {
  const [spentTime, setSpentTime] = useState<{ [key: string]: number }>({});
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  React.useEffect(() => {
    getHoursPerActivity();
  }, []);

  let data: Data | { color: string; title: string; value: any }[] = [];

  const getHoursPerActivity = async () => {
    const timeEntries = await getTimeEntries(
      undefined,
      oneYearAgo,
      today,
      context,
      "me"
    );
    let activityHours: { [key: string]: any } = {};

    timeEntries.map((entry: FetchedTimeEntry) => {
      if (!activityHours[entry.activity.name]) {
        activityHours[entry.activity.name] = 0;
      }
      activityHours[entry.activity.name] += entry.hours;
    });
    setSpentTime(activityHours);
  };

  // Example inspiration: https://medium.com/@tgknapp11/render-a-chart-with-react-minimal-pie-chart-e30420c9276c
  let keys = Object.keys(spentTime);
  keys.map((key) => {
    let randomColor = "#000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });

    let insert = {
      color: randomColor,
      title: key,
      value: spentTime[key],
    };

    data.push(insert);
  });
  const context = React.useContext(AuthContext);

  return (
    <>
      <main>
        <PieChart
          data={data}
          style={{ height: "320px" }}
          label={(data) => data.dataEntry.value}
          labelStyle={{
            fontSize: "0.40rem",
            fontWeight: "800",
          }}
          radius={42}
          labelPosition={112}
        />
        ;
        <header>
          <h1>Spent time</h1>
        </header>
        <p>{JSON.stringify(spentTime)}</p>
      </main>
    </>
  );
};
