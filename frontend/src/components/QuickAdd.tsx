import React, { useState, useRef } from "react";
import { IdName, Issue, IssueActivityPair, ToastMsg } from "../model";
import { getApiEndpoint, useDebounce } from "../utils";
import x from "../icons/x.svg";
import check from "../icons/check.svg";
import { AuthContext } from "../components/AuthProvider";
import { PUBLIC_API_URL, headers, useEscaper } from "../utils";

export const QuickAdd = ({
  addIssueActivity,
  toastList,
  onToastListUpdate,
  issueInputRef,
}: {
  addIssueActivity: (pair: IssueActivityPair) => void;
  toastList: ToastMsg[];
  onToastListUpdate: (newToast: ToastMsg) => void;
  issueInutRef: React.RefObject<HTMLInputElement>;
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
  const escapeUnderscore = (s: string) =>
      s.replace(/(^|[^\\])_/g, '$1\\_');

  React.useEffect(() => {
    let endpoint = "/api/activities";
    if (issue) endpoint += "?project_id=" + (issue.project.id ? issue.project.id : "0") + "&issue_id=" + (issue.id ? issue.id : "0");
    let didCancel = false;
    const loadActivities = async () => {
      let result: { time_entry_activities: IdName[] } = await getApiEndpoint(
        endpoint,
        context
      );
      if (!didCancel && result) {
        setActivities(result.time_entry_activities ? result.time_entry_activities : []);
        setActivity(activity ? activity : (Array.isArray(result.time_entry_activities) && result.time_entry_activities.length > 0) ? result.time_entry_activities[0] : null);
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
          let byWabi: { issues: Issue[] } = { issues: [] };
          let candidateIssues: Issue[];

          if (isNumber(search.text)) {
            const endpoint = `/api/issues?status_id=*&issue_id=${search.text}`;
            res = await getApiEndpoint(endpoint, context);
          } else {
            const searchQuery = escapeUnderscore(search.text);
            res = await searchIssues(searchQuery);
            byWabi = await searchIssuesByWabi(searchQuery);
          }

          const map = new Map<number, Issue>();
          for (const issue of res.issues || []) map.set(issue.id, issue);
          for (const issue of byWabi.issues || []) map.set(issue.id, issue);
          const combined = Array.from(map.values());

          if (!didCancel && combined) {
            if (combined.length > 0) {
              if (combined.length === 1) {
                let foundIssue = combined[0];
                candidateIssues = [foundIssue];
                //allow for valid issue id autoselection
                if (isNumber(search.text)) {
                  setIssue(foundIssue);
                }
              } else {
                candidateIssues = combined;
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
    let element = issueInputRef.current;
    element.value = selection.id.toString();
    setIsAutoCompleteVisible(false);
  };

  const WABI_CUSTOM_FIELD_ID = 30;

  const searchIssuesByWabi = async (searchQuery: string) => {
    const encoded = encodeURIComponent("~" + searchQuery);
    const endpoint = `/api/issues?status_id=*&limit=5&cf_${WABI_CUSTOM_FIELD_ID}=${encoded}`;
    return await getApiEndpoint(endpoint, context) as { issues: Issue[] };
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
      projects: "1",
    };

    const foundIssues: { issues: Issue[] } = await fetch(
      `${PUBLIC_API_URL}/api/search?q=${searchQuery}&limit=5`,
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
    let classes = "quick-add-input ";
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

  const getSuggestionsLength = () => {
    return suggestionsRef.current.childNodes.length;
  };

  const suggestionsRef = useRef(null);
  useEscaper(suggestionsRef, handleHideAutocomplete);

  const handleInputToAutocompleteFocus = (event: any) => {
    event.preventDefault();
    if (event.key == "ArrowUp" || event.key == "ArrowDown") {
      let sugLen = getSuggestionsLength();
      if (sugLen > 0) {
        let suggestionIndex = 0;
        event.key == "ArrowUp" ? sugLen - 1 : 0;

        suggestionsRef.current.childNodes[
          suggestionIndex
        ].childNodes[0].focus();
      }
    }
  };

  const handleAutocompleteNavigation = (event: any) => {
    event.preventDefault();
    if (event.key == "ArrowUp" || event.key == "ArrowDown") {
      let sugLen = getSuggestionsLength();
      if (sugLen > 0) {
        let sourceIndex: number = Number(event.target.id.split("-")[2]);
        let targetIndex: number =
          event.key == "ArrowUp" ? sourceIndex - 1 : sourceIndex + 1;
        if (targetIndex >= 0 && targetIndex < sugLen) {
          suggestionsRef.current.childNodes[targetIndex].childNodes[0].focus();
        } else if (targetIndex < 0) {
          issueInputRef.current.focus();
        } else if (targetIndex >= sugLen) {
          suggestionsRef.current.childNodes[0].childNodes[0].focus();
        }
      }
    }
  };

  return (
    <div className="quick-add-wrapper">
      <div className="quick-add">
        <div className="quick-add-input-wrapper">
          <label htmlFor="input-issue">Search issue</label>
          <input
            id="input-issue"
            placeholder="3499, analysis, ..."
            aria-keyshortcuts="ctrl+a"
            ref={issueInputRef}
            autoComplete="off"
            className={getSearchClasses()}
            type="text"
            onKeyUp={(ev) => {
              handleInputToAutocompleteFocus(ev);
            }}
            min={0}
            onChange={(e) => {
              setSearch({ ...search, text: e.target.value });
              setIssue(null);
            }}
            title={(issue && issue.subject) || ""}
          />
          <img
            className={
              search.text === "" ? "validation-icon hidden" : "validation-icon"
            }
            src={getValidationIconSrc()}
            alt="Validity"
            aria-label="Indicator for validity of issue number - x for not valid, check for valid."
          />
        </div>
        <div className="quick-add-input-wrapper">
          <label htmlFor="select-activity">Select activity</label>
          <select
            className="quick-add-input"
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
        </div>
        <div className="quick-add-input-wrapper">
          <button className="basic-button add-button" onClick={handleAdd}>
            Add row
          </button>
        </div>
      </div>
      {search.suggestions.length > 0 && isAutoCompleteVisible && (
        <ul
          id="suggestions-ul"
          className="autocomplete-container"
          ref={suggestionsRef}
        >
          {search.suggestions.map((item, index) => (
            <li key={item.id}>
              <button
                id={"suggestion-btn-" + index.toString()}
                onKeyUp={(ev) => {
                  handleAutocompleteNavigation(ev);
                }}
                // Make sure scroll does not disturb kbd nav
                onKeyDown={(ev) => {
                  if (ev.key == "ArrowUp" || ev.key == "ArrowDown") {
                    ev.preventDefault();
                  }
                }}
                key={item.id}
                onClick={() => suggestionSelected(item)}
                className="autocomplete-button"
              >
                #{item.id} - {item.subject}
                {(() => {
                  const wabi = item.custom_fields?.find(cf => cf.name === "WABI ID")?.value;
                  return wabi ? ` (WABI: ${wabi})` : "";
                })()}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
