import React, { useState } from "react";
import { IdName, Issue, SNOWPACK_PUBLIC_API_URL } from "../model";
import plus from "../icons/plus.svg";
import { useNavigate } from "react-router-dom";

export const QuickAdd = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<IdName[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

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
        } else if (res.status === 401) {
          // Redirect to login page
          navigate("/");
        } else {
          throw new Error("Could not find activities.");
        }
      })
      .catch((error) => console.log(error));
    if (result) setActivities(result.time_entry_activities);
    console.log(result);
  };

  React.useEffect(() => {
    getActivities();
  }, []);

  const searchIssue = async (event) => {
    const issue = event.target.value;
    let result: { issues: Issue[] } = await fetch(
      `${SNOWPACK_PUBLIC_API_URL}/api/issues?issue_id=${issue}`,
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
          throw new Error("Could not find issue.");
        }
      })
      .catch((error) => console.log(error));
    if (result && result.issues.length > 0) {
      setIssues(result.issues);
      console.log(result.issues);
    }
  };

  return (
    <div className="row">
      <h2>Quick add:</h2>

      <input
        aria-label="Issue"
        id="input-issue"
        className="col-2 quick-add-input"
        type="number"
        min={0}
        onKeyUp={searchIssue}
        placeholder="Type issue number..."
        list="issue-list"
      />
      <datalist id="issue-list">
        {issues &&
          issues.map((issue) => {
            return <option>{issue.description}</option>;
          })}
      </datalist>

      <select
        aria-label="Activity"
        className="col-3"
        name="activity"
        id="select-activity"
      >
        {activities &&
          activities.map((activity) => {
            return (
              <option id={activity.id} key={activity.id}>
                {activity.name}
              </option>
            );
          })}
      </select>
      <button className=" basic-button plus-button">
        <img src={plus} />
      </button>
    </div>
  );
};
