import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { Login } from "./pages/Login";
import { Reporter } from "./pages/reporter";

export const App = () => {
  return (
    <>
      <Router>
        <Switch>
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/report">
            <Reporter />
          </Route>
        </Switch>
      </Router>
    </>
  );
};
