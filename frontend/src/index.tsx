import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./bootstrap.min.css";
import "./index.css";
import { App } from "./App";

const root = ReactDOM.createRoot(document.querySelector("#root") as HTMLElement);
root.render(<App />);
