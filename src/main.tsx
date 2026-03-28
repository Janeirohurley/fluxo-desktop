import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProviders } from "./app/providers/AppProviders";
import "./app/styles/index.css";
import { UpdateNotification } from "./shared/components/UpdateNotification";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProviders>
      <UpdateNotification/>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
