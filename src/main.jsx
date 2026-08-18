import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "overlayscrollbars/overlayscrollbars.css";
import { SettingsProvider } from './shared/contexts/SettingsContext';
import { VideoLibraryProvider } from './shared/contexts/VideoLibraryContext';
import { WatchHistoryProvider } from './shared/contexts/WatchHistoryContext';
import { VideoPlayer } from './shared/services/VideoEngine';

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
