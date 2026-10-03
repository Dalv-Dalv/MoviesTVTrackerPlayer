import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryStore } from '../store/useLibraryStore';
import { useWatchHistoryStore } from '../store/useWatchHistoryStore';
import { useGenres } from '../contexts/GenresContext';
import { useTMDB } from './useTMDB';
import { fetchDetailedMetadata } from '../services/TMDBMetadata';

export function useMediaData(compId) {
    const navigate = useNavigate();
    const library = useLibraryStore(state => state.library);
    const rawMedia = library[compId];
    
    const [mediaType, tmdbId] = typeof compId === 'string' && compId.includes('_') 
        ? compId.split('_') 
        : [null, compId];

    const history = useWatchHistoryStore(state => state.history[compId]);
    const historyLoaded = useWatchHistoryStore(state => state.isLoaded);
    const setProgressAndSave = (progress) => useWatchHistoryStore.getState().setProgressAndSave(compId, progress);

    const { movieGenres, tvGenres } = useGenres();

    const tmdb = useTMDB();
    const [onlineMedia, setOnlineMedia] = useState(null);
    const [isLoadingOnline, setIsLoadingOnline] = useState(false);

    useEffect(() => {
        if (!rawMedia && mediaType && tmdbId && tmdb) {
            setIsLoadingOnline(true);
            fetchDetailedMetadata(tmdb, tmdbId, mediaType, false)
                .then(data => {
                    setOnlineMedia(data);
                    setIsLoadingOnline(false);
                })
                .catch(err => {
                    console.error("Failed to fetch online media:", err);
                    setIsLoadingOnline(false);
                });
        }
    }, [rawMedia, mediaType, tmdbId, tmdb]);

    const media = useMemo(() => {
        const sourceMedia = rawMedia || onlineMedia;
        if (!sourceMedia) return null;

        if (sourceMedia.type === 'movie') {
            return {
                ...sourceMedia,
                history: history || null,
            };
        }

        if (sourceMedia.type === 'show') {
            return {
                ...sourceMedia,
                history: history || null,
                seasons: sourceMedia.seasons?.map(season => ({
                    ...season,
                    isLastWatched: history?.lastPlayedSeason ? history.lastPlayedSeason === season.number : season.number === 1,
                    episodes: season.episodes?.map(episode => {
                        const epHistory = season.number === 0
                            ? history?.specials?.episodes?.[episode.number - 1]
                            : history?.seasons?.[season.number - 1]?.episodes?.[episode.number - 1];

                        return {
                            ...episode,
                            history: epHistory || null
                        };
                    })
                }))
            };
        }

        return sourceMedia;
    }, [rawMedia, onlineMedia, history]);

    return {
        media,
        isLoadingOnline,
        mediaType,
        tmdbId,
        tmdbId,
        navigate,
        history,
        historyLoaded,
        setProgressAndSave,
        movieGenres,
        tvGenres
    };
}
