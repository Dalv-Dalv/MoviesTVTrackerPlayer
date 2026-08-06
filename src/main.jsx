import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { SettingsProvider } from "./shared/SettingsContext";
import { VideoLibraryProvider } from "./shared/VideoLibraryContext";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <SettingsProvider>
            <VideoLibraryProvider>
                <App />
            </VideoLibraryProvider>
        </SettingsProvider>
    </React.StrictMode>,
);
