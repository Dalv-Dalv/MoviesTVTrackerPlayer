import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { SettingsProvider } from "./shared/SettingsContext";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <SettingsProvider>
            <App />
        </SettingsProvider>
    </React.StrictMode>,
);
