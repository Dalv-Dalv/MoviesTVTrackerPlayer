import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLibraryStore } from '../store/useLibraryStore';
import { useWatchHistoryStore, getResumeEpisode } from '../store/useWatchHistoryStore';
import { VideoPlayer } from '../services/VideoEngine';
import { useVideoState } from './useVideoState';

export function usePlaybackSession(tmdbId, isScrubbing) {
    const [searchParams] = useSearchParams();
    const library = useLibraryStore(state => state.library);
    const media = library[tmdbId];

    const [activePath, setActivePath] = useState(null);
    const [currentSeason, setCurrentSeason] = useState(null);
    const [currentEpisode, setCurrentEpisode] = useState(null);

    const videoState = useVideoState(activePath);
    const { isPlayerReady, isVideoLoaded, currentTime, duration, isInitialLoadComplete } = videoState;

    const history = useWatchHistoryStore(state => state.history[tmdbId]);
    const historyLoaded = useWatchHistoryStore(state => state.isLoaded);

    const sessionId = useRef(Date.now()).current;
    const lastSaveTime = useRef(0);
    const latestTime = useRef(0);
    
    // Store latest state values in refs for the unmount cleanup function
    const stateRef = useRef({ currentSeason, currentEpisode, duration });
    useEffect(() => {
        stateRef.current = { currentSeason, currentEpisode, duration };
    }, [currentSeason, currentEpisode, duration]);

    // Get file to play
    useEffect(() => {
        if (!historyLoaded || !media) return;

        if (media.type === 'movie') {
            if (media.filePaths && media.filePaths.length > 0) setActivePath(media.filePaths[0]);
        } else if (media.type === 'show') {
            let sNum = searchParams.get('s') ? parseInt(searchParams.get('s')) : null;
            let eNum = searchParams.get('e') ? parseInt(searchParams.get('e')) : null;

            if (sNum === null || eNum === null) {
                const resumeInfo = getResumeEpisode(history, media);
                if (resumeInfo) {
                    sNum = resumeInfo.season;
                    eNum = resumeInfo.episode;
                }
            }

            if (sNum !== null && eNum !== null) {
                setCurrentSeason(sNum);
                setCurrentEpisode(eNum);

                let epData;
                if (sNum === 0) {
                    epData = media.specials?.episodes?.[eNum - 1];
                } else {
                    epData = media.seasons?.[sNum - 1]?.episodes?.[eNum - 1];
                }

                if (epData && epData.filePaths && epData.filePaths.length > 0) {
                    setActivePath(epData.filePaths[0]);
                }
            }
        }
    }, [historyLoaded, searchParams, media, history]);

    // Initialize hasLoaded
    const hasLoaded = useRef(false);
    useEffect(() => {
        hasLoaded.current = false;
    }, [activePath]);

    // Try resume playback from watch history
    useEffect(() => {
        if (isPlayerReady && activePath && historyLoaded && !hasLoaded.current && media) {
            let startPosition = 0;
            if (media.type === 'movie') {
                if (history) startPosition = history.completed ? 0 : history.progress;
            } else if (media.type === 'show' && currentSeason !== null && currentEpisode !== null) {
                if (history) {
                    let epHist;
                    if (currentSeason === 0) {
                        epHist = history.specials?.episodes?.[currentEpisode - 1];
                    } else {
                        epHist = history.seasons?.[currentSeason - 1]?.episodes?.[currentEpisode - 1];
                    }
                    if (epHist) {
                        startPosition = epHist.completed ? 0 : epHist.progress;
                    }
                }
            }
            VideoPlayer.load(activePath, startPosition);
            hasLoaded.current = true;
        }
    }, [isPlayerReady, activePath, historyLoaded, history, tmdbId, currentSeason, currentEpisode, media]);

    useEffect(() => {
        if (isVideoLoaded) {
            VideoPlayer.setPaused(false);
        }
    }, [isVideoLoaded]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('player-loading', { detail: { isLoading: !isInitialLoadComplete } }));
    }, [isInitialLoadComplete]);

    // Save watch history
    useEffect(() => {
        latestTime.current = currentTime;

        if (duration === 0 || isScrubbing) return;

        const timeNow = Date.now();

        if (timeNow - lastSaveTime.current >= 10000) {
            useWatchHistoryStore.getState().updateProgressAndSave(tmdbId, currentTime, duration, sessionId, currentSeason, currentEpisode);
            lastSaveTime.current = timeNow;
        }
    }, [currentTime, duration, isScrubbing, tmdbId, sessionId, currentSeason, currentEpisode]);

    useEffect(() => {
        return () => {
            if (latestTime.current > 0) {
                const { currentSeason: s, currentEpisode: e, duration: d } = stateRef.current;
                useWatchHistoryStore.getState().updateProgressAndSave(tmdbId, latestTime.current, d, sessionId, s, e);
            }
        };
    }, [tmdbId, sessionId]);

    return {
        media,
        activePath,
        currentSeason,
        currentEpisode,
        ...videoState
    };
}
