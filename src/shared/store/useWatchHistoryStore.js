import { create } from 'zustand';
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('watch_history.json');

let saveTimeout = null;
const debouncedSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            await store.save();
        } catch (e) {
            console.error("Failed to save history to disk", e);
        }
    }, 5000);
};

export const useWatchHistoryStore = create((set, get) => ({
    history: {},
    isLoaded: false,

    loadHistoryOnBoot: async () => {
        try {
            const entries = await store.entries();
            const historyObj = {};
            for (const [key, value] of entries) {
                historyObj[key] = value;
            }
            set({ history: historyObj, isLoaded: true });
        } catch (error) {
            console.error("Failed to load history on boot", error);
            set({ isLoaded: true });
        }
    },

    updateProgressAndSave: async (compId, currentTime, duration, sessionId, seasonNum = null, episodeNum = null) => {
        set((state) => {
            const newState = { ...state.history };

            const existingMedia = newState[compId] ? structuredClone(newState[compId]) : { progress: 0, completed: false, watchLog: [], loggedSessions: [], seasons: [], specials: { episodes: [] } };
            const isCompleted = duration > 0 ? (currentTime / duration) > 0.9 : false;
            const now = Date.now();

            if (seasonNum !== null && episodeNum !== null) {
                existingMedia.seasons = existingMedia.seasons || [];
                existingMedia.specials = existingMedia.specials || { episodes: [] };

                let epData;
                if (seasonNum === 0) {
                    existingMedia.specials.episodes[episodeNum - 1] = existingMedia.specials.episodes[episodeNum - 1] || { progress: 0, completed: false, watchLog: [], loggedSessions: [] };
                    epData = existingMedia.specials.episodes[episodeNum - 1];
                } else {
                    existingMedia.seasons[seasonNum - 1] = existingMedia.seasons[seasonNum - 1] || { episodes: [] };
                    existingMedia.seasons[seasonNum - 1].episodes[episodeNum - 1] = existingMedia.seasons[seasonNum - 1].episodes[episodeNum - 1] || { progress: 0, completed: false, watchLog: [], loggedSessions: [] };
                    epData = existingMedia.seasons[seasonNum - 1].episodes[episodeNum - 1];
                }

                if (isCompleted && sessionId && !epData.loggedSessions.includes(sessionId)) {
                    epData.watchLog = epData.watchLog || [];
                    epData.watchLog.push(now);
                    epData.loggedSessions.push(sessionId);
                }

                epData.progress = currentTime;
                epData.duration = duration;
                epData.completed = isCompleted;
                epData.lastPlayed = now;

                existingMedia.lastPlayedSeason = seasonNum;
                existingMedia.lastPlayedEpisode = episodeNum;
                existingMedia.lastPlayed = now;
            } else {
                if (isCompleted && sessionId && !existingMedia.loggedSessions?.includes(sessionId)) {
                    existingMedia.watchLog = existingMedia.watchLog || [];
                    existingMedia.loggedSessions = existingMedia.loggedSessions || [];
                    existingMedia.watchLog.push(now);
                    existingMedia.loggedSessions.push(sessionId);
                }

                existingMedia.progress = currentTime;
                existingMedia.duration = duration;
                existingMedia.completed = isCompleted;
                existingMedia.lastPlayed = now;
            }

            newState[compId] = existingMedia;
            store.set(compId, existingMedia).then(() => debouncedSave());

            return { history: newState };
        });
    },

    toggleManualCompletion: async (compId, seasonNum = null, episodeNum = null) => {
        set(state => {
            const newState = { ...state.history };
            const existingMedia = newState[compId] ? structuredClone(newState[compId]) : { progress: 0, completed: false, watchLog: [], loggedSessions: [], seasons: [], specials: { episodes: [] } };
            const now = Date.now();

            if (seasonNum !== null && episodeNum !== null) {
                existingMedia.seasons = existingMedia.seasons || [];
                existingMedia.specials = existingMedia.specials || { episodes: [] };

                let epData;
                if (seasonNum === 0) {
                    existingMedia.specials.episodes[episodeNum - 1] = existingMedia.specials.episodes[episodeNum - 1] || { progress: 0, completed: false, watchLog: [], loggedSessions: [] };
                    epData = existingMedia.specials.episodes[episodeNum - 1];
                } else {
                    existingMedia.seasons[seasonNum - 1] = existingMedia.seasons[seasonNum - 1] || { episodes: [] };
                    existingMedia.seasons[seasonNum - 1].episodes[episodeNum - 1] = existingMedia.seasons[seasonNum - 1].episodes[episodeNum - 1] || { progress: 0, completed: false, watchLog: [], loggedSessions: [] };
                    epData = existingMedia.seasons[seasonNum - 1].episodes[episodeNum - 1];
                }

                const isCurrentlyCompleted = epData.completed;
                if (!isCurrentlyCompleted) {
                    epData.watchLog = epData.watchLog || [];
                    epData.watchLog.push(now);
                }

                epData.progress = 0;
                epData.completed = !isCurrentlyCompleted;
                epData.lastPlayed = now;
                existingMedia.lastPlayedSeason = seasonNum;
                existingMedia.lastPlayedEpisode = episodeNum;
                existingMedia.lastPlayed = now;
            } else {
                const isCurrentlyCompleted = existingMedia.completed;
                if (!isCurrentlyCompleted) {
                    existingMedia.watchLog = existingMedia.watchLog || [];
                    existingMedia.watchLog.push(now);
                }

                existingMedia.progress = 0;
                existingMedia.completed = !isCurrentlyCompleted;
                existingMedia.lastPlayed = now;
            }

            newState[compId] = existingMedia;
            store.set(compId, existingMedia).then(() => debouncedSave());

            return { history: newState };
        });
    },

    setProgressAndSave: async (compId, newProgress, seasonNum = null, episodeNum = null) => {
        set(state => {
            const newState = { ...state.history };
            const existingMedia = newState[compId] ? structuredClone(newState[compId]) : { progress: 0, completed: false, watchLog: [], loggedSessions: [], seasons: [], specials: { episodes: [] } };
            const now = Date.now();

            if (seasonNum !== null && episodeNum !== null) {
                existingMedia.seasons = existingMedia.seasons || [];
                existingMedia.specials = existingMedia.specials || { episodes: [] };

                let epData;
                if (seasonNum === 0) {
                    existingMedia.specials.episodes[episodeNum - 1] = existingMedia.specials.episodes[episodeNum - 1] || { progress: 0, completed: false, watchLog: [], loggedSessions: [] };
                    epData = existingMedia.specials.episodes[episodeNum - 1];
                } else {
                    existingMedia.seasons[seasonNum - 1] = existingMedia.seasons[seasonNum - 1] || { episodes: [] };
                    existingMedia.seasons[seasonNum - 1].episodes[episodeNum - 1] = existingMedia.seasons[seasonNum - 1].episodes[episodeNum - 1] || { progress: 0, completed: false, watchLog: [], loggedSessions: [] };
                    epData = existingMedia.seasons[seasonNum - 1].episodes[episodeNum - 1];
                }

                epData.progress = newProgress;
                if (newProgress === 0) epData.completed = false;
                epData.lastPlayed = now;

                existingMedia.lastPlayedSeason = seasonNum;
                existingMedia.lastPlayedEpisode = episodeNum;
                existingMedia.lastPlayed = now;
            } else {
                existingMedia.progress = newProgress;
                if (newProgress === 0) existingMedia.completed = false;
                existingMedia.lastPlayed = now;
            }

            newState[compId] = existingMedia;
            store.set(compId, existingMedia).then(() => debouncedSave());

            return { history: newState };
        });
    },

    forceSaveToDisk: async () => {
        if (saveTimeout) clearTimeout(saveTimeout);
        try {
            await store.save();
        } catch (e) {
            console.error("Failed to force save history to disk", e);
        }
    }
}));

export const getResumeEpisode = (historyData, libraryMedia) => {
    if (!libraryMedia) return null;

    if (libraryMedia.type === 'movie') {
        return { isCompleted: historyData?.completed || false, progress: historyData?.progress || 0 };
    }

    if (libraryMedia.type === 'show') {
        if (!historyData || historyData.lastPlayedSeason === undefined || historyData.lastPlayedEpisode === undefined) {
            if (libraryMedia.seasons) {
                for (let sIdx = 0; sIdx < libraryMedia.seasons.length; sIdx++) {
                    const season = libraryMedia.seasons[sIdx];
                    if (!season || !season.episodes) continue;
                    for (let eIdx = 0; eIdx < season.episodes.length; eIdx++) {
                        const ep = season.episodes[eIdx];
                        if (ep && ep.filePaths && ep.filePaths.length > 0) {
                            return { season: sIdx + 1, episode: eIdx + 1 };
                        }
                    }
                }
            }
            if (libraryMedia.specials && libraryMedia.specials.episodes) {
                for (let eIdx = 0; eIdx < libraryMedia.specials.episodes.length; eIdx++) {
                    const ep = libraryMedia.specials.episodes[eIdx];
                    if (ep && ep.filePaths && ep.filePaths.length > 0) {
                        return { season: 0, episode: eIdx + 1 };
                    }
                }
            }
            return null;
        }

        const { lastPlayedSeason, lastPlayedEpisode, seasons, specials } = historyData;

        let epData;
        if (lastPlayedSeason === 0) {
            epData = specials?.episodes?.[lastPlayedEpisode - 1];
        } else {
            epData = seasons?.[lastPlayedSeason - 1]?.episodes?.[lastPlayedEpisode - 1];
        }

        if (!epData || !epData.completed) {
            return { season: lastPlayedSeason, episode: lastPlayedEpisode, progress: epData?.progress || 0 };
        }

        if (lastPlayedSeason === 0) {
            const specialsData = libraryMedia.specials;

            if (specialsData && specialsData.episodes && specialsData.episodes[lastPlayedEpisode]) {
                return { season: 0, episode: lastPlayedEpisode + 1 };
            }

            if (libraryMedia.seasons && libraryMedia.seasons[0] && libraryMedia.seasons[0].episodes && libraryMedia.seasons[0].episodes[0]) {
                return { season: 1, episode: 1 };
            }
        } else {
            const currentSeasonData = libraryMedia.seasons[lastPlayedSeason - 1];
            if (currentSeasonData && currentSeasonData.episodes && currentSeasonData.episodes[lastPlayedEpisode]) {
                return { season: lastPlayedSeason, episode: lastPlayedEpisode + 1 };
            }

            const nextSeasonData = libraryMedia.seasons[lastPlayedSeason];
            if (nextSeasonData && nextSeasonData.episodes && nextSeasonData.episodes[0]) {
                return { season: lastPlayedSeason + 1, episode: 1 };
            }
        }

        return null;
    }

    return null;
};
