import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "overlayscrollbars/overlayscrollbars.css";
import { SettingsProvider } from './shared/contexts/SettingsContext';
import { WatchHistoryProvider } from './shared/contexts/WatchHistoryContext';
import { GenresProvider } from './shared/contexts/GenresContext';
import { VideoPlayer } from './shared/services/VideoEngine';

VideoPlayer.init();

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <SettingsProvider>
            <WatchHistoryProvider>
                <GenresProvider>
                    <App />
                </GenresProvider>
            </WatchHistoryProvider>
        </SettingsProvider>
    </React.StrictMode>,
);
