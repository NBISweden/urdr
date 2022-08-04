import React, { useState, useRef } from "react";
import { IdName, Issue, IssueActivityPair, ToastMsg } from "../model";
import { getApiEndpoint, useDebounce } from "../utils";
import plus from "../icons/plus.svg";
import x from "../icons/x.svg";
import check from "../icons/check.svg";
import { AuthContext } from "../components/AuthProvider";
import { PUBLIC_API_URL, headers, useEscaper } from "../utils";
import * as ReactDOM from "react-dom";

export const QuickAdd = ({
  addIssueActivity,
  toastList,
  onToastListUpdate,
}: {
  addIssueActivity: (pair: IssueActivityPair) => void;
  toastList: ToastMsg[];
  onToastListUpdate: (newToast: ToastMsg) => void;
}) => {
  const [activities, setActivities] = useState<IdName[]>([]);
  const [issue, setIssue] = useState<Issue>(null);
  const [activity, setActivity] = useState<IdName>();
  const [search, setSearch] = useState({
    text: "",
    suggestions: [],
  });
  const [isAutoCompleteVisible, setIsAutoCompleteVisible] = useState(false);

  const debouncedSearch = useDebounce(search, 500);
  const context = React.useContext(AuthContext);

  const isNumber = (s: string) => {
    return Number.isInteger(Number(s));
  };

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
      const searchSuggestions = async () => {
        if (search.text === "") {
          setIsAutoCompleteVisible(false);
        }
        if (debouncedSearch && search.text) {
          let res: { issues: Issue[] };
          let candidateIssues: Issue[];

          if (isNumber(search.text)) {
            const endpoint = `/api/issues?status_id=*&issue_id=${search.text}`;
            res = await getApiEndpoint(endpoint, context);
          } else {
            res = await searchIssues(search.text);
          }
          if (!didCancel && res.issues) {
            if (res.issues.length > 0) {
              if (res.issues.length === 1) {
                let foundIssue = res.issues[0];
                candidateIssues = [foundIssue];
                //allow for valid issue id autoselection
                if (isNumber(search.text)) {
                  setIssue(foundIssue);
                }
              } else {
                candidateIssues = res.issues;
              }
              setSearch({ text: undefined, suggestions: candidateIssues });
              setIsAutoCompleteVisible(true);
            } else {
              setIsAutoCompleteVisible(false);
            }
          } else {
            setIsAutoCompleteVisible(false);
          }
        }
      };
      searchSuggestions();
      return () => {
        didCancel = true;
      };
    },
    [debouncedSearch] // Only call effect if debounced search term changes
  );

  const suggestionSelected = (selection: Issue) => {
    setIssue(selection);
    // Update input box with selected issue
    let element = ReactDOM.findDOMNode(document.getElementById("input-issue"));
    element.value = selection.id.toString();
    setIsAutoCompleteVisible(false);
  };

  const searchIssues = async (searchQuery: string) => {
    let logout = false;

    let payload = {
      scope: "all",
      all_words: "1",
      titles_only: "0",
      issues: "1",
      news: "0",
      // documents: "0" produces weird results.
      changesets: "0",
      wiki_pages: "0",
      messages: "0",
      // projects: "0" produces weird results.
      open_issues: "1",
    };

    const foundIssues: { issues: Issue[] } = await fetch(
      `${PUBLIC_API_URL}/api/search?q=${searchQuery}`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      }
    )
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else if (res.status === 401) {
          logout = true;
        } else {
          throw new Error("Could not search for issues.");
        }
      })
      .catch((error) => {
        onToastListUpdate({
          type: "warning",
          timeout: 5000,
          message: error.message,
        });
      });
    if (logout) context.setUser(null);
    return foundIssues;
  };

  const handleAdd = (e) => {
    if (issue === null) {
      onToastListUpdate({
        type: "warning",
        timeout: 5000,
        message:
          "We couldn't add anything. Make sure to type a valid issue number and choose an activity.",
      });
    } else {
      const pair: IssueActivityPair = {
        issue: issue,
        activity: activity,
        custom_name: issue.subject + " - " + activity.name,
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
    let classes = "col-3 footer-field ";
    if (search.text != "") classes += issue ? "valid" : "invalid";
    return classes;
  };

  const getValidationIconSrc = () => {
    let src = "";
    if (search.text != "") src = issue ? check : x;
    return src;
  };

  const handleHideAutocomplete = () => {
    setIsAutoCompleteVisible(false);
  };

  const wrapperRef = useRef(null);
  useEscaper(wrapperRef, handleHideAutocomplete);

  return (
    <div>
      <h2> Add a new row</h2>
      <div className="row">
        <label htmlFor="input-issue" className="col-3 input-label hidden">
          Issue (e.g. 3499) / free text
        </label>
        <label htmlFor="select-activity" className="col-3 select-label hidden">
          Select activity
        </label>
      </div>
      <div className="row">
        <input
          id="input-issue"
          autoComplete="off"
          className={getSearchClasses()}
          type="text"
          min={0}
          onChange={(e) => {
            setSearch({ ...search, text: e.target.value });
            setIssue(null);
          }}
          title={(issue && issue.subject) || ""}
        />
        <img
          className={
            search.text === "" ? "validation-icon hiden" : "validation-icon"
          }
          src={getValidationIconSrc()}
          alt="Validity"
          aria-label="Indicator for validity of issue number - x for not valid, check for valid."
        />
        <select
          className="col-3 footer-field"
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
        <button className="col-3 basic-button plus-button" onClick={handleAdd}>
          <img src={plus} alt="Add line" />
        </button>
      </div>
      {search.suggestions.length > 0 && isAutoCompleteVisible && (
        <ul className="col-8 autocomplete-container" ref={wrapperRef}>
          {search.suggestions.map((item) => (
            <li key={item.id} className="autocomplete-item">
              <button
                key={item.id}
                onClick={() => suggestionSelected(item)}
                className="autocomplete-button"
              >
                #{item.id} - {item.subject}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
