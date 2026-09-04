import { BaseDirectory, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { createContext, useContext, useEffect, useState } from "react";

const HISTORY_FILE = 'watch_history.json';
const WatchHistoryContext = createContext();

export function WatchHistoryProvider({ children }) {
    const [history, setHistory] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        async function loadHistoryOnBoot() {
            try {
                if (await exists(HISTORY_FILE, { baseDir: BaseDirectory.AppData })) {
                    const data = await readTextFile(HISTORY_FILE, { baseDir: BaseDirectory.AppData });
                    setHistory(JSON.parse(data));
                }
            } catch(error) {
                console.error("Failed to load history", error);
            } finally {
                setIsLoaded(true);
            }
        }

        loadHistoryOnBoot();
    }, []);

    const updateProgressAndSave = async (tmdbId, currentTime, duration, sessionId) => {
        setHistory((prev) => {
            const newState = { ...prev };
            
            const existing = newState[tmdbId] || { watchLog: [], loggedSessions: [] };

            const isCompleted = duration > 0 ? (currentTime / duration) > 0.9 : false; // TODO: consider looking at the video frames for lots of black or video chapters
            
            if (isCompleted && sessionId && !existing.loggedSessions.includes(sessionId)) {
                existing.watchLog.push(Date.now());
                existing.loggedSessions.push(sessionId);
            }
            
            newState[tmdbId] = {
                ...existing,
                progress: currentTime,
                duration: duration,
                completed: isCompleted,
                lastPlayed: Date.now()
            };

            writeTextFile(HISTORY_FILE, JSON.stringify(newState), { baseDir: BaseDirectory.AppData })
                .catch(e => console.error("Failed to save progress", e));

            return newState;
        });
    };

    const toggleManualCompletion = async (tmdbId) => {
        setHistory(prev => {
            const newState = { ...prev };
            const existing = newState[tmdbId] || { watchLog: [], loggedSessions: [] };
            
            const isCurrentlyCompleted = existing.completed;
            
            if (!isCurrentlyCompleted) {
                existing.watchLog.push(Date.now());
            }

            newState[tmdbId] = {
                ...existing,
                progress: 0, 
                completed: !isCurrentlyCompleted,
                lastPlayed: Date.now()
            };

            writeTextFile(HISTORY_FILE, JSON.stringify(newState), { baseDir: BaseDirectory.AppData })
                 .catch(e => console.error("Failed to save completion", e));
                 
            return newState;
        });
    };

    const setProgressAndSave = async (tmdbId, newProgress) => {
        setHistory(prev => {
            const newState = { ...prev };
            const existing = newState[tmdbId] || { watchLog: [], loggedSessions: [] };
            
            newState[tmdbId] = {
                ...existing,
                progress: newProgress,
                completed: newProgress === 0 ? false : existing.completed,
                lastPlayed: Date.now()
            };

            writeTextFile(HISTORY_FILE, JSON.stringify(newState), { baseDir: BaseDirectory.AppData })
                 .catch(e => console.error("Failed to save progress", e));
                 
            return newState;
        });
    };

    return (
        <WatchHistoryContext.Provider value={{
            history,
            updateProgressAndSave,
            setProgressAndSave,
            toggleManualCompletion,
            isLoaded
        }}>
            {children}
        </WatchHistoryContext.Provider>
    );
}

export const useWatchHistory = (tmdbId) => {
    const context = useContext(WatchHistoryContext);
    
    if (tmdbId) {
        return {
            history: context.history[tmdbId] || null,
            updateProgressAndSave: (currentTime, duration, sessionId) => context.updateProgressAndSave(tmdbId, currentTime, duration, sessionId),
            setProgressAndSave: (newProgress) => context.setProgressAndSave(tmdbId, newProgress),
            toggleManualCompletion: () => context.toggleManualCompletion(tmdbId),
            isLoaded: context.isLoaded
        };
    }

    return context;
};