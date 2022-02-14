import React, { useState } from "react";
import { TextField, Button } from "@material-ui/core";

export function Login() {
  const [username, set_username] = useState("");
  const [password, set_password] = useState("");

  function authenticateRedmine() {
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
        console.log("Login success");
        var w = window.open("http://localhost:8080/issues");
      } else {
        console.log("Error: login failed");
        var w = window.open("/login");
      }
    });
  }

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
        onChange={(e) => set_username(e.target.value)}
      ></TextField>
      <TextField
        id="password"
        margin="dense"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => set_password(e.target.value)}
      ></TextField>
      <Button
        style={loginButtonStyle}
        label="Submit"
        onClick={() => authenticateRedmine()}
        key={"Login"}
        name={"Login"}
        visible={true}
        type={"submit"}
      >
        {" "}
        Login
      </Button>
    </>
  );
}
