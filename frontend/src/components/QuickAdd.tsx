import React, { useState } from "react";
import { IdName, Issue, IssueActivityPair } from "../model";
import { getApiEndpoint, useDebounce } from "../utils";
import plus from "../icons/plus.svg";
import { useNavigate } from "react-router-dom";

export const QuickAdd = ({ addIssueActivity }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<IdName[]>([]);
  const [issue, setIssue] = useState<Issue>();
  const [activity, setActivity] = useState<IdName>();
  const [search, setSearch] = useState("");
  // Debounce search term so that it only gives us latest value ...
  // ... if searchTerm has not been updated within last 500ms.
  // The goal is to only have the API call fire when user stops typing ...
  const debouncedSearch = useDebounce(search, 600);

  const [classes, setClasses] = useState<string>("col-2 quick-add-input");

  const getActivities = async () => {
    let result: { time_entry_activities: IdName[] } = await getApiEndpoint(
      "/api/activities"
    );
    if (result) {
      setActivities(result.time_entry_activities);
      setActivity(result.time_entry_activities[0]);
    }
  };

  React.useEffect(() => {
    getActivities();
  }, []);

  const searchIssue = async () => {
    console.log("Searching issue...");
    let classes = "col-2 quick-add-input ";

    const endpoint = `/api/issues?issue_id=${search}`;
    let result: { issues: Issue[] } = await getApiEndpoint(endpoint);
    if (result) {
      if (result.issues.length > 0) {
        const issue: Issue = {
          id: result.issues[0].id,
          subject: result.issues[0].subject,
        };
        setIssue(issue);
        classes += " valid";
      } else {
        classes += " invalid";
        setIssue(undefined);
      }
    }
    setClasses(classes);
  };

  // Effect for API call
  React.useEffect(
    () => {
      if (debouncedSearch) {
        searchIssue();
      } else setClasses("col-2 quick-add-input");
    },
    [debouncedSearch] // Only call effect if debounced search term changes
  );

  const handleAdd = (e) => {
    const pair: IssueActivityPair = {
      issue: issue,
      activity: activity,
      custom_name: issue.subject + "-" + activity.name,
    };

    addIssueActivity(pair);
  };

  const handleSetActivity = (e) => {
    const id = e.target.value;
    const activity = activities.find((e) => {
      return e.id == id;
    });
    setActivity(activity);
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
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Type issue number..."
        title={(issue && issue.subject) || ""}
      />

      <select
        aria-label="Activity"
        className="col-3"
        name="activity"
        id="select-activity"
        onChange={handleSetActivity}
      >
        {activities &&
          activities.map((activity) => {
            return (
              <option value={activity.id} key={activity.id}>
                {activity.name}
              </option>
            );
          })}
      </select>
      <button
        className=" basic-button plus-button"
        onClick={handleAdd}
        disabled={issue === undefined}
      >
        <img src={plus} />
      </button>
    </div>
  );
};
