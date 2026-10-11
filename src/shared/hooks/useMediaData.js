import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLibraryStore } from '../store/useLibraryStore';
import { useWatchHistoryStore } from '../store/useWatchHistoryStore';
import { useGenres } from '../contexts/GenresContext';
import { useTMDB } from './useTMDB';
import { fetchMediaItem, fetchSeasonEpisodes } from '../services/TMDBMetadata';

export function useMediaData(compId, activeSeasonNumber = null) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const rawMedia = useLibraryStore(state => state.library[compId]);

    const [mediaType, tmdbId] = typeof compId === 'string' && compId.includes('_')
        ? compId.split('_')
        : [null, compId];

    const history = useWatchHistoryStore(state => state.history[compId]);
    const historyLoaded = useWatchHistoryStore(state => state.isLoaded);
    const setProgressAndSave = useCallback(
        (progress, seasonNum, episodeNum) => useWatchHistoryStore.getState().setProgressAndSave(compId, progress, seasonNum, episodeNum),
        [compId]
    );

    const { movieGenres, tvGenres } = useGenres();
    const tmdb = useTMDB();

    const { data: onlineMedia, isLoading: isLoadingOnlineMedia, isError: isMediaError } = useQuery({
        queryKey: ['mediaDetails', mediaType, tmdbId],
        queryFn: () => fetchMediaItem(tmdb, tmdbId, mediaType),
        enabled: !!tmdb && !!tmdbId && !!mediaType,
    });

    const isShow = mediaType === 'show' || rawMedia?.type === 'show';

    const targetSeasonNumber = useMemo(() => {
        if (!isShow) return null;
        if (activeSeasonNumber != null) return activeSeasonNumber;
        if (history?.lastPlayedSeason != null) return history.lastPlayedSeason;
        const seasons = rawMedia?.seasons || onlineMedia?.seasons;
        const firstSeason = seasons?.find(s => s.number !== 0) || seasons?.[0];
        return firstSeason ? firstSeason.number : 1;
    }, [isShow, activeSeasonNumber, history, rawMedia, onlineMedia]);

    const { data: onlineSeasonEpisodes, isLoading: isLoadingSeasonEpisodes } = useQuery({
        queryKey: ['seasonEpisodes', tmdbId, targetSeasonNumber],
        queryFn: () => fetchSeasonEpisodes(tmdb, tmdbId, targetSeasonNumber),
        enabled: isShow && !!tmdb && !!tmdbId && targetSeasonNumber != null,
    });

    useEffect(() => {
        if (!isShow || !tmdb || !tmdbId) return;
        const seasonsList = rawMedia?.seasons || onlineMedia?.seasons;
        if (!seasonsList || seasonsList.length === 0) return;

        let isCancelled = false;
        const seasonsToPrefetch = seasonsList.filter(
            s => s.number !== targetSeasonNumber && (s.episodeCount == null || s.episodeCount > 0)
        );

        if (seasonsToPrefetch.length === 0) return;

        const prefetchRemainingSeasons = async () => {
            for (const season of seasonsToPrefetch) {
                if (isCancelled) break;
                const queryKey = ['seasonEpisodes', tmdbId, season.number];
                if (!queryClient.getQueryData(queryKey)) {
                    try {
                        await queryClient.prefetchQuery({
                            queryKey,
                            queryFn: () => fetchSeasonEpisodes(tmdb, tmdbId, season.number),
                            staleTime: 1000 * 60 * 30, // 30 minutes
                        });
                    } catch (e) {
                        console.warn(`[useMediaData] Background prefetch failed for S${season.number}:`, e);
                    }
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }
        };

        const timer = setTimeout(prefetchRemainingSeasons, 300);
        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [isShow, tmdb, tmdbId, rawMedia?.seasons, onlineMedia?.seasons, targetSeasonNumber, queryClient]);

    const baseMedia = useMemo(() => {
        if (!rawMedia && !onlineMedia) return null;
        if (!rawMedia) return onlineMedia;
        if (!onlineMedia) return rawMedia;

        const merged = {
            ...rawMedia,
            overview: onlineMedia.overview || rawMedia.overview,
            tagline: onlineMedia.tagline || rawMedia.tagline,
            status: onlineMedia.status || rawMedia.status,
            voteAverage: onlineMedia.voteAverage ?? rawMedia.voteAverage,
            voteCount: onlineMedia.voteCount ?? rawMedia.voteCount,
            runtime: onlineMedia.runtime ?? rawMedia.runtime,
            trailerKey: onlineMedia.trailerKey || rawMedia.trailerKey,
            cast: (onlineMedia.cast && onlineMedia.cast.length > 0) ? onlineMedia.cast : rawMedia.cast,
            directors: (onlineMedia.directors && onlineMedia.directors.length > 0) ? onlineMedia.directors : rawMedia.directors,
            genreIds: (onlineMedia.genreIds && onlineMedia.genreIds.length > 0) ? onlineMedia.genreIds : rawMedia.genreIds,

            posterPath: rawMedia.posterPath || onlineMedia.posterPath,
            posterPathFull: rawMedia.posterPathFull || onlineMedia.posterPathFull,
            rawPosterUrl: rawMedia.rawPosterUrl || onlineMedia.rawPosterUrl,
            backdropPath: rawMedia.backdropPath || onlineMedia.backdropPath,
            backdropPathFull: rawMedia.backdropPathFull || onlineMedia.backdropPathFull,
            rawBackdropUrl: rawMedia.rawBackdropUrl || onlineMedia.rawBackdropUrl,
            logoPath: rawMedia.logoPath || onlineMedia.logoPath,
            logoPathFull: rawMedia.logoPathFull || onlineMedia.logoPathFull,
            rawLogoUrl: rawMedia.rawLogoUrl || onlineMedia.rawLogoUrl,
        };

        if (merged.type === 'show') {
            const localSeasons = rawMedia.seasons || [];
            const onlineSeasons = onlineMedia.seasons || [];

            merged.seasons = onlineSeasons.map(onlineSeason => {
                const localSeason = localSeasons.find(s => s.number === onlineSeason.number);
                const isTarget = onlineSeason.number === targetSeasonNumber;
                const cachedEpisodes = queryClient.getQueryData(['seasonEpisodes', tmdbId, onlineSeason.number]);
                const onlineEps = (isTarget && onlineSeasonEpisodes) ? onlineSeasonEpisodes : cachedEpisodes;

                const episodesSource = onlineEps || (localSeason?.episodes || null);

                let mergedEpisodes = episodesSource;
                if (onlineEps && localSeason?.episodes) {
                    const localEps = localSeason.episodes;
                    mergedEpisodes = onlineEps.map(onlineEp => {
                        const localEp = localEps.find(e => e.number === onlineEp.number);
                        if (localEp) {
                            return {
                                ...onlineEp,
                                ...localEp,
                            };
                        }
                        return onlineEp;
                    });
                }

                return {
                    ...onlineSeason,
                    ...(localSeason || {}),
                    name: onlineSeason.name || localSeason?.name,
                    overview: onlineSeason.overview || localSeason?.overview,
                    posterPath: localSeason?.posterPath || onlineSeason.posterPath,
                    episodeCount: onlineSeason.episodeCount ?? localSeason?.episodeCount ?? 0,
                    airDate: onlineSeason.airDate || localSeason?.airDate || null,
                    episodes: mergedEpisodes,
                };
            });

            if (onlineMedia.specials || rawMedia.specials) {
                const onlineSpecials = onlineMedia.specials;
                const localSpecials = rawMedia.specials;
                const isTarget = targetSeasonNumber === 0;
                const cachedEpisodes = queryClient.getQueryData(['seasonEpisodes', tmdbId, 0]);
                const onlineEps = (isTarget && onlineSeasonEpisodes) ? onlineSeasonEpisodes : cachedEpisodes;
                const episodesSource = onlineEps || (localSpecials?.episodes || null);

                let mergedEpisodes = episodesSource;
                if (onlineEps && localSpecials?.episodes) {
                    const localEps = localSpecials.episodes;
                    mergedEpisodes = onlineEps.map(onlineEp => {
                        const localEp = localEps.find(e => e.number === onlineEp.number);
                        if (localEp) {
                            return { ...onlineEp, ...localEp };
                        }
                        return onlineEp;
                    });
                }

                merged.specials = {
                    ...(onlineSpecials || {}),
                    ...(localSpecials || {}),
                    episodeCount: onlineSpecials?.episodeCount ?? localSpecials?.episodeCount ?? 0,
                    airDate: onlineSpecials?.airDate || localSpecials?.airDate || null,
                    episodes: mergedEpisodes,
                };
            }
        }

        return merged;
    }, [rawMedia, onlineMedia, onlineSeasonEpisodes, targetSeasonNumber, queryClient, tmdbId]);

    const lastSyncedRef = useRef(null);
    useEffect(() => {
        if (!rawMedia || !onlineMedia || !compId) return;

        const syncKey = `${compId}_${onlineMedia.voteAverage}_${onlineMedia.voteCount}_${onlineMedia.status}_${targetSeasonNumber}_${onlineSeasonEpisodes?.length || 0}`;
        if (lastSyncedRef.current === syncKey) return;
        lastSyncedRef.current = syncKey;

        const updates = {};
        let hasDiscrepancy = false;

        const fieldsToCheck = ['overview', 'tagline', 'status', 'voteAverage', 'voteCount', 'trailerKey', 'runtime'];
        for (const field of fieldsToCheck) {
            if (onlineMedia[field] != null && onlineMedia[field] !== rawMedia[field]) {
                updates[field] = onlineMedia[field];
                hasDiscrepancy = true;
            }
        }

        if (onlineMedia.cast?.length && (!rawMedia.cast || rawMedia.cast.length !== onlineMedia.cast.length)) {
            updates.cast = onlineMedia.cast;
            hasDiscrepancy = true;
        }

        if (onlineMedia.directors?.length && (!rawMedia.directors || rawMedia.directors.length !== onlineMedia.directors.length)) {
            updates.directors = onlineMedia.directors;
            hasDiscrepancy = true;
        }

        if (rawMedia.type === 'show' && onlineMedia.seasons) {
            const localSeasons = rawMedia.seasons || [];
            let seasonsChanged = false;

            const updatedSeasons = onlineMedia.seasons.map(onlineSeason => {
                const localSeason = localSeasons.find(s => s.number === onlineSeason.number);
                if (!localSeason) {
                    seasonsChanged = true;
                    return onlineSeason;
                }

                let seasonUpdated = false;
                const updatedSeason = { ...localSeason };

                if (onlineSeason.name && onlineSeason.name !== localSeason.name) {
                    updatedSeason.name = onlineSeason.name;
                    seasonUpdated = true;
                }
                if (onlineSeason.episodeCount && onlineSeason.episodeCount !== localSeason.episodeCount) {
                    updatedSeason.episodeCount = onlineSeason.episodeCount;
                    seasonUpdated = true;
                }

                if (onlineSeason.number === targetSeasonNumber && onlineSeasonEpisodes?.length) {
                    const localEps = localSeason.episodes || [];
                    const mergedEps = onlineSeasonEpisodes.map(onlineEp => {
                        const localEp = localEps.find(e => e.number === onlineEp.number);
                        if (localEp) {
                            return {
                                ...onlineEp,
                                ...localEp,
                            };
                        }
                        return onlineEp;
                    });

                    if (mergedEps.length !== localEps.length) {
                        updatedSeason.episodes = mergedEps;
                        seasonUpdated = true;
                    }
                }

                if (seasonUpdated) {
                    seasonsChanged = true;
                    return updatedSeason;
                }
                return localSeason;
            });

            if (seasonsChanged || updatedSeasons.length !== localSeasons.length) {
                updates.seasons = updatedSeasons;
                hasDiscrepancy = true;
            }
        }

        if (hasDiscrepancy) {
            useLibraryStore.getState().updateMediaMetadata(compId, updates);
        }
    }, [rawMedia, onlineMedia, onlineSeasonEpisodes, targetSeasonNumber, compId]);

    // Attach watch history to final media object
    const media = useMemo(() => {
        if (!baseMedia) return null;

        if (baseMedia.type === 'movie') {
            return {
                ...baseMedia,
                history: history || null,
            };
        }

        if (baseMedia.type === 'show') {
            const seasons = (baseMedia.seasons || []).map(season => {
                const isTarget = season.number === targetSeasonNumber;
                const rawEpisodes = season.episodes || (isTarget ? onlineSeasonEpisodes : null);

                return {
                    ...season,
                    isLastWatched: history?.lastPlayedSeason ? history.lastPlayedSeason === season.number : season.number === 1,
                    episodes: rawEpisodes?.map(episode => {
                        const epHistory = season.number === 0
                            ? history?.specials?.episodes?.[episode.number - 1]
                            : history?.seasons?.[season.number - 1]?.episodes?.[episode.number - 1];

                        return {
                            ...episode,
                            history: epHistory || null
                        };
                    }) || null
                };
            });

            let specials = baseMedia.specials;
            if (specials) {
                const isTarget = specials.number === targetSeasonNumber;
                const rawEpisodes = specials.episodes || (isTarget ? onlineSeasonEpisodes : null);
                specials = {
                    ...specials,
                    episodes: rawEpisodes?.map(episode => {
                        const epHistory = history?.specials?.episodes?.[episode.number - 1];
                        return {
                            ...episode,
                            history: epHistory || null
                        };
                    }) || null
                };
            }

            return {
                ...baseMedia,
                history: history || null,
                seasons,
                specials,
            };
        }

        return baseMedia;
    }, [baseMedia, history, targetSeasonNumber, onlineSeasonEpisodes]);

    const isLoading = !rawMedia && isLoadingOnlineMedia;

    const targetHasCachedEpisodes = isShow && targetSeasonNumber != null && (
        !!onlineSeasonEpisodes ||
        !!queryClient.getQueryData(['seasonEpisodes', tmdbId, targetSeasonNumber]) ||
        (baseMedia?.seasons?.find(s => s.number === targetSeasonNumber)?.episodes != null)
    );
    const isSeasonLoading = isShow && isLoadingSeasonEpisodes && !targetHasCachedEpisodes;

    return {
        media,
        isLoading,
        isSeasonLoading,
        isError: isMediaError,
        mediaType,
        tmdbId,
        navigate,
        history,
        historyLoaded,
        setProgressAndSave,
        movieGenres,
        tvGenres,
        targetSeasonNumber
    };
}
