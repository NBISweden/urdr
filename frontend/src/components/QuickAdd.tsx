import React, { useState } from "react";
import { IdName, Issue, IssueActivityPair } from "../model";
import { getApiEndpoint, useDebounce } from "../utils";
import plus from "../icons/plus.svg";
import x from "../icons/x.svg";
import check from "../icons/check.svg";

import { useNavigate } from "react-router-dom";

export const QuickAdd = ({ addIssueActivity }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<IdName[]>([]);
  const [issue, setIssue] = useState<Issue>(null);
  const [activity, setActivity] = useState<IdName>();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

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

    const endpoint = `/api/issues?issue_id=${search}`;
    let result: { issues: Issue[] } = await getApiEndpoint(endpoint);
    if (result) {
      if (result.issues.length > 0) {
        const issue: Issue = {
          id: result.issues[0].id,
          subject: result.issues[0].subject,
        };
        setIssue(issue);
      }
    }
  };

  // Effect for API call
  React.useEffect(
    () => {
      if (debouncedSearch) {
        searchIssue();
      }
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

  const getSearchClasses = () => {
    let classes = "col-2 quick-add-input ";
    if (search != "") classes += issue ? "valid" : "invalid";
    return classes;
  };

  const getValidationIconSrc = () => {
    let src = "";
    if (search != "") src = issue ? check : x;
    return src;
  };

  return (
    <div className="row">
      <h2>Quick add:</h2>
      <input
        aria-label="Issue"
        id="input-issue"
        className={getSearchClasses()}
        type="number"
        min={0}
        onChange={(e) => {
          setSearch(e.target.value);
          setIssue(null);
        }}
        placeholder="Type issue number..."
        title={(issue && issue.subject) || ""}
      />
      <img
        className={search === "" ? "validation-icon hiden" : "validation-icon"}
        src={getValidationIconSrc()}
      />
      <select
        aria-label="Activity"
        className="col-3"
        name="activity"
        id="select-activity"
        onChange={handleSetActivity}
        disabled={search !== "" && issue === null}
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
        disabled={issue === null}
      >
        <img src={plus} />
      </button>
    </div>
  );
};
