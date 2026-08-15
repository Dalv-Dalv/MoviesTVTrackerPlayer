import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "overlayscrollbars/overlayscrollbars.css";
import { SettingsProvider } from "./shared/SettingsContext";
import { VideoLibraryProvider } from "./shared/VideoLibraryContext";
import { WatchHistoryProvider } from "./shared/WatchHistoryContext";
import { VideoPlayer } from "./shared/VideoEngine";

VideoPlayer.init();

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <SettingsProvider>
            <WatchHistoryProvider>
                <VideoLibraryProvider>
                    <App />
                </VideoLibraryProvider>
            </WatchHistoryProvider>
        </SettingsProvider>
    </React.StrictMode>,
);
