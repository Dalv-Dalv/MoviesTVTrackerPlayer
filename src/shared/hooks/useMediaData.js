import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryStore } from '../store/useLibraryStore';
import { useWatchHistoryStore } from '../store/useWatchHistoryStore';
import { useGenres } from '../contexts/GenresContext';

export function useMediaData(tmdbId) {
    const navigate = useNavigate();
    const library = useLibraryStore(state => state.library);
    const rawMedia = library[tmdbId];

    const history = useWatchHistoryStore(state => state.history[tmdbId]);
    const historyLoaded = useWatchHistoryStore(state => state.isLoaded);
    const setProgressAndSave = (progress) => useWatchHistoryStore.getState().setProgressAndSave(tmdbId, progress);

    const { movieGenres, tvGenres } = useGenres();

    const media = useMemo(() => {
        if (!rawMedia) return null;

        if (rawMedia.type === 'movie') {
            return {
                ...rawMedia,
                history: history || null,
            };
        }

        if (rawMedia.type === 'show') {
            return {
                ...rawMedia,
                history: history || null,
                seasons: rawMedia.seasons?.map(season => ({
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

        return rawMedia;
    }, [rawMedia, history]);

    return {
        media,
        tmdbId,
        navigate,
        history,
        historyLoaded,
        setProgressAndSave,
        movieGenres,
        tvGenres
    };
}
