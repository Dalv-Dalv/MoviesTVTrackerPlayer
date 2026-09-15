import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "overlayscrollbars/overlayscrollbars.css";
import { useSettingsStore } from './shared/store/useSettingsStore';
import { GenresProvider } from './shared/contexts/GenresContext';
import { VideoPlayer } from './shared/services/VideoEngine';
import { useWatchHistoryStore } from './shared/store/useWatchHistoryStore';

VideoPlayer.init();
useWatchHistoryStore.getState().loadHistoryOnBoot();
useSettingsStore.getState().initAndLoadSettings();

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <GenresProvider>
            <App />
        </GenresProvider>
    </React.StrictMode>,
);
