import * as React from "react";
import * as ReactDOM from "react-dom";
import { Login } from "./login";
import { Reporter } from "./reporter";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

const Main = (
  <>
    <h1> Welcome to urdr </h1>
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/login">Login</Link>
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

ReactDOM.render(Main, document.querySelector("#root"));
