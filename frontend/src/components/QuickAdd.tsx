import React, { useState } from "react";
import { IdName, Issue, IssueActivityPair } from "../model";
import { getApiEndpoint, useDebounce } from "../utils";
import plus from "../icons/plus.svg";
import x from "../icons/x.svg";
import check from "../icons/check.svg";
import { AuthContext } from "../components/AuthProvider";

export const QuickAdd = ({
  addIssueActivity,
}: {
  addIssueActivity: (pair: IssueActivityPair) => void;
}) => {
  const [activities, setActivities] = useState<IdName[]>([]);
  const [issue, setIssue] = useState<Issue>(null);
  const [activity, setActivity] = useState<IdName>();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const context = React.useContext(AuthContext);

  React.useEffect(() => {
    let endpoint = "/api/activities";
    if (issue) endpoint += "?issue_id=" + issue.id;
    let didCancel = false;
    const loadActivities = async () => {
      let result: { time_entry_activities: IdName[] } = await getApiEndpoint(
        endpoint,
        context
      );
      if (!didCancel && result) {
        setActivities(result.time_entry_activities);
        setActivity(result.time_entry_activities[0]);
      }
    };

    loadActivities();
    return () => {
      didCancel = true;
    };
  }, [issue]);

  // Effect for API call
  React.useEffect(
    () => {
      let didCancel = false;
      const searchIssue = async () => {
        if (debouncedSearch) {
          const endpoint = `/api/issues?status_id=*&issue_id=${search}`;
          let result: { issues: Issue[] } = await getApiEndpoint(
            endpoint,
            context
          );
          if (!didCancel) {
            if (result.issues.length > 0) {
              const issue: Issue = {
                id: result.issues[0].id,
                subject: result.issues[0].subject,
              };
              setIssue(issue);
            }
          }
        }
      };
      searchIssue();
      return () => {
        didCancel = true;
      };
    },
    [debouncedSearch] // Only call effect if debounced search term changes
  );

  const handleAdd = (e) => {
    if (issue === null) {
      alert(
        "We couldn't add anything. Make sure to type a valid issue number and choose an activity."
      );
    } else {
      const pair: IssueActivityPair = {
        issue: issue,
        activity: activity,
        custom_name: issue.subject + "-" + activity.name,
        is_hidden: false,
      };

      addIssueActivity(pair);
    }
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
      <h2> Add a new issue</h2>
      <input
        aria-labelledby="input-issue"
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
        alt="Validity"
        aria-label="Indicator for validity of issue number - x for not valid, check for valid."
      />
      <select
        aria-label="Activity"
        className="col-3"
        name="activity"
        id="select-activity"
        onChange={handleSetActivity}
        style={{ width: "50%" }}
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
      <button className=" basic-button plus-button" onClick={handleAdd}>
        <img src={plus} alt="Add line" />
      </button>
    </div>
  );
};
