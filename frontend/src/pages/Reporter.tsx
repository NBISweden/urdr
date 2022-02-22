import React, { useState } from "react";

export interface TimeEntry {
  issue_id: number;
  activity_id: number;
  hours: number;
  comments: string;
  spent_on: Date;
  user_id: number;
}

export function Reporter() {
  //used default values to speed testing
  const [hours, set_hours] = useState(5 as number);
  const [date, set_date] = useState("2022-02-16" as string);
  const [issue, set_issue] = useState(0 as number);
  const [activity, set_activity] = useState(18 as number);

  let headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  const [issues, setIssues] = useState([]);

  const IssuesList = () => {
    return (
      <>
        <div>
          <span>Issue</span> :
          {issues && issues.length > 0 && (
            <select onChange={(e) => set_issue(e.target.value)}>
              {issues.map((data, index) => {
                return <option value={data.id}>{data.subject}</option>;
              })}
            </select>
          )}
        </div>
      </>
    );
  };

  React.useEffect(() => {
    fetch("http://localhost:8080/api/issues", {
      method: "GET",
      credentials: "include",
      headers: headers,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data.issues);
        setIssues(data.issues);
        if (data.issues.length > 0) set_issue(data.issues[0].id);
      });
  }, []);

  function reportTime() {
    // We are not doing account linking

    let timeLog: TimeEntry = {
      issue_id: Number(issue),
      activity_id: Number(activity),
      hours: Number(hours),
      comments: "",
      spent_on: date,
      user_id: 232,
    };
    console.log(timeLog);

    fetch("http://localhost:8080/api/report", {
      body: JSON.stringify(timeLog),
      method: "POST",
      credentials: "include",
      headers: headers,
    }).then((response) => {
      if (response.ok) {
        console.log("Time reported");
      } else {
        console.log("Time report failed");
      }
    });
  }

  const reportButtonStyle = {
    width: "50",
    border: "3px solid darkblue",
    margin: "0px 50px",
    padding: "10px",
  };

  return (
    <>
      <button onClick={reportTime()}>Report time</button>{" "}
    </>
  );
}
