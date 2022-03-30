import React, { useState } from "react";
import { IdName, Issue } from "../model";
import { getApiEndpoint } from "../utils";

import plus from "../icons/plus.svg";
import { useNavigate } from "react-router-dom";

export const QuickAdd = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<IdName[]>([]);
  const [issue, setIssue] = useState<Issue>();
  const [classes, setClasses] = useState<string>("col-2 quick-add-input");

  const getActivities = async () => {
    let result: { time_entry_activities: IdName[] } = await getApiEndpoint(
      "/api/activities"
    );
    if (result) setActivities(result.time_entry_activities);
    console.log(result);
  };

  React.useEffect(() => {
    getActivities();
  }, []);

  const searchIssue = async (event) => {
    console.log("Searching issue...");
    const issue_str = event.target.value;
    let classes = "col-2 quick-add-input ";

    const endpoint = `/api/issues?issue_id=${issue_str}`;
    let result: { issues: Issue[] } = await getApiEndpoint(endpoint);
    if (result) {
      if (result.issues.length > 0) {
        setIssue(result.issues[0]);
        classes += " valid";
      } else {
        classes += " invalid";
        setIssue(undefined);
      }
    }
    setClasses(classes);
  };

  return (
    <div className="row">
      <h2>Quick add:</h2>

      <input
        aria-label="Issue"
        id="input-issue"
        className={classes}
        type="number"
        min={0}
        onKeyUp={searchIssue}
        placeholder="Type issue number..."
        title={(issue && issue.description) || ""}
      />

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
      <button
        className=" basic-button plus-button"
        disabled={issue === undefined}
      >
        <img src={plus} />
      </button>
    </div>
  );
};
