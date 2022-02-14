import React, { useState } from "react";
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import { TextField, Button } from "@material-ui/core";

export interface TimeEntry {
  issue_id: number;
  activity_id: number;
  hours: number;
  comments: string;
  spent_on: Date;
  user_id: number;
}

export function Reporter() {
  const [hours, set_hours] = useState(0 as number);
  const [date, set_date] = useState("" as string);
  const [issue, set_issue] = useState(0 as number);
  const [activity, set_activity] = useState(0 as number);

  function reportTime() {
    // We are not doing account linking
    let headers = new Headers();
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");

    let timeLog: TimeEntry = {
      issue_id: Number(issue),
      activity_id: Number(activity),
      hours: Number(hours),
      comments: "",
      spent_on: date,
      user_id: 232,
    };

    fetch("http://localhost:8080/api/report", {
      body: JSON.stringify(timeLog),
      method: "POST",
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
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <KeyboardDatePicker
          autoOk
          disableFuture
          className="simpleField"
          label="Day to report"
          format="yyyy-MM-dd"
          value={date}
          InputLabelProps={{
            shrink: true,
          }}
          onChange={(dte: Date) => {
            set_date(dte.toISOString().split("T")[0]);
          }}
        />
      </MuiPickersUtilsProvider>
      <TextField
        id="hours"
        autoFocus
        placeholder="8"
        margin="dense"
        label="hours"
        value={hours}
        onChange={(e) => set_hours(e.target.value)}
      ></TextField>
      <TextField
        id="project"
        placeholder="3499"
        margin="dense"
        label="issue"
        value={issue}
        onChange={(e) => set_issue(e.target.value)}
      ></TextField>
      <TextField
        id="activity"
        placeholder="18"
        margin="dense"
        label="activity"
        value={activity}
        onChange={(e) => set_activity(e.target.value)}
      ></TextField>
      <Button
        style={reportButtonStyle}
        label="Submit"
        onClick={() => reportTime()}
        key={"report"}
        name={"report"}
        visible={true}
        type={"submit"}
      >
        {" "}
        Report
      </Button>
    </>
  );
}
