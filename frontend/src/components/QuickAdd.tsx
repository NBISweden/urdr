import React, { useState } from "react";
import { IdName, SNOWPACK_PUBLIC_API_URL } from "../model";
import plus from "../icons/plus.svg";

export const QuickAdd = () => {
  const [activities, setActivities] = useState<IdName[]>([]);
  let headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  const getActivities = async () => {
    let result: { time_entry_activities: IdName[] } = await fetch(
      `${SNOWPACK_PUBLIC_API_URL}/api/activities`,
      {
        method: "GET",
        credentials: "include",
        headers: headers,
      }
    )
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("Could not find activities.");
        }
      })
      .catch((error) => console.log(error));

    setActivities(result.time_entry_activities);
    console.log(result);
  };

  React.useEffect(() => {
    getActivities();
  }, []);

  return (
    <div className="row">
      <h2>Quick add:</h2>
      <label htmlFor="input-issue" className="accessibility-label">
        Issue
      </label>
      <input
        id="input-issue"
        className="col-2 issue-label"
        type="number"
        min={0}
        onChange={(event: any) => {
          console.log(event);
        }}
        placeholder="Type issue number..."
      />
      <label htmlFor="select-activity" className="accessibility-label">
        Activity
      </label>
      <select className="col-3" name="activity" id="select-activity">
        {activities &&
          activities.map((activity) => {
            return <option>{activity.name}</option>;
          })}
      </select>
      <button className=" basic-button plus-button">
        <img src={plus} />
      </button>
    </div>
  );
};
