import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "overlayscrollbars/overlayscrollbars.css";
import { useSettingsStore } from './shared/store/useSettingsStore';
import { GenresProvider } from './shared/contexts/GenresContext';
import { VideoPlayer } from './shared/services/VideoEngine';
import { useWatchHistoryStore } from './shared/store/useWatchHistoryStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 3
        },
    },
});

VideoPlayer.init();
useWatchHistoryStore.getState().loadHistoryOnBoot();
useSettingsStore.getState().initAndLoadSettings();

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <GenresProvider>
                <App />
            </GenresProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
