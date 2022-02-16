import React, { useState } from "react";
import { TextField, Button } from "@material-ui/core";
import { useHistory } from "react-router-dom";

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const history = useHistory();

  const authenticateRedmine = () => {
    // We are not doing account linking
    let headers = new Headers();
    headers.set("Authorization", "Basic " + btoa(username + ":" + password));
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");

    fetch("http://localhost:8080/api/login", {
      body: "",
      method: "POST",
      credentials: "include",
      headers: headers,
    }).then((response) => {
      if (response.ok) {
        history.push("/timelog");
      } else {
        console.log("Error: login failed");
        setUsername("");
        setPassword("");
      }
    });
  };

  const loginButtonStyle = {
    width: "50",
    border: "3px solid darkblue",
    margin: "0px 50px",
    padding: "10px",
  };

  return (
    <>
      <TextField
        id="username"
        autoFocus
        margin="dense"
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      ></TextField>
      <TextField
        id="password"
        margin="dense"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      ></TextField>
      <Button
        style={loginButtonStyle}
        label="Submit"
        onClick={() => authenticateRedmine()}
        key={"Login"}
        name={"Login"}
        visible="true"
        type={"submit"}
      >
        {" "}
        Login
      </Button>
    </>
  );
};
