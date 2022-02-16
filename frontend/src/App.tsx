import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { Login } from "./login";
import { Reporter } from "./reporter";

export const App = () => {
  return(
    <>
      <h1> Welcome to urdr </h1>
      <Router>
        <div>
          <nav>
            <ul>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/report">Report</Link>
              </li>
            </ul>
          </nav>
          <Switch>
            <Route path="/report">
              <Reporter />
            </Route>
            <Route path="/login">
              <Login />
            </Route>
          </Switch>
        </div>
      </Router>
    </>
  );
}