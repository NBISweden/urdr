import "../index.css";
import React, { useState } from "react";
import { AuthContext } from "../components/AuthProvider";
import { getTimeEntries } from "../utils";
import { FetchedTimeEntry } from "model";
import { PieChart } from 'react-minimal-pie-chart';

export const SpentTime = () => {
  const [spentTime, setSpentTime] = useState<{}>({});

  React.useEffect(() => {
    getHoursPerActivity();
  }, []);

  let data = [];

  const getHoursPerActivity = async () => {
    const timeEntries = await getTimeEntries(
      undefined,
      new Date(2019, 6, 5, 10, 33, 30),
      new Date(),
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

  let keys= Object.keys(spentTime)
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
            data={ data }
            style={{ height: '300px' }}
            label={(data) => data.dataEntry.value}
            labelStyle={{
              fontSize: "0.40rem",
              fontColor: "FFFFFA",
              fontWeight: "800",
            }}
            labelPosition={112}
        />;
        <header>
          <h1>Spent time</h1>
        </header>
        <p>{JSON.stringify(spentTime)}</p>
      </main>
    </>
  );
};
