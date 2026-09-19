import { useState, useEffect, useRef, useMemo, createContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLibraryStore } from '../store/useLibraryStore';
import { useWatchHistoryStore } from '../store/useWatchHistoryStore';
import { useGenres } from '../contexts/GenresContext';
import { getImageUrl } from '../services/TMDBMetadata';
import { isMobile } from '../utils/PlatformUtils';
import { DesktopMediaDetails } from '../../desktop/components/DesktopMediaDetails';
import { MobileMediaDetails } from '../../mobile/components/MobileMediaDetails';
import { ArrowLeftIcon } from 'lucide-react';

export const MediaDetailsContext = createContext();

const TAB_STORAGE_KEY = 'desktopMediaDetailsTabs';
const MAX_STORED_TABS = 50;

function getSavedTab(tmdbId, mediaType) {
    try {
        const stored = JSON.parse(localStorage.getItem(TAB_STORAGE_KEY) || '{}');
        const saved = stored[tmdbId]?.tab;
        if (saved === 'episodes' && mediaType !== 'show') return 'details';
        return saved || 'details';
    } catch {
        return 'details';
    }
}

function saveTab(tmdbId, tab) {
    try {
        const stored = JSON.parse(localStorage.getItem(TAB_STORAGE_KEY) || '{}');
        stored[tmdbId] = { tab, ts: Date.now() };

        const keys = Object.keys(stored);
        if (keys.length > MAX_STORED_TABS) {
            keys.sort((a, b) => stored[b].ts - stored[a].ts);
            const pruned = {};
            for (let i = 0; i < MAX_STORED_TABS; i++) {
                pruned[keys[i]] = stored[keys[i]];
            }
            localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(pruned));
        } else {
            localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(stored));
        }
    } catch (e) {
        console.error("Failed to save tab", e);
    }
}

export function MediaDetails({ className = '' }) {
    const { tmdbId } = useParams();
    const navigate = useNavigate();
    const library = useLibraryStore(state => state.library);
    const rawMedia = library[tmdbId];
    const containerRef = useRef(null);

    const history = useWatchHistoryStore(state => state.history[tmdbId]);
    const historyLoaded = useWatchHistoryStore(state => state.isLoaded);
    const setProgressAndSave = (progress) => useWatchHistoryStore.getState().setProgressAndSave(tmdbId, progress);
    
    const { movieGenres, tvGenres } = useGenres();
    
    const [activeModal, setActiveModal] = useState(null);
    const [activeTab, setActiveTab] = useState(() => getSavedTab(tmdbId, rawMedia?.type));
    const prevTmdbId = useRef(tmdbId);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !activeModal) {
                navigate(-1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, activeModal]);

    if (tmdbId !== prevTmdbId.current) {
        prevTmdbId.current = tmdbId;
        setActiveTab(getSavedTab(tmdbId, rawMedia?.type));
    }

    useEffect(() => {
        if (activeTab === 'episodes' && rawMedia?.type !== 'show') {
            setActiveTab('details');
        } else {
            saveTab(tmdbId, activeTab);
        }
    }, [activeTab, rawMedia?.type, tmdbId]);

    // Join watch history data with media object
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

    // Overview truncation/show more
    const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const overviewRef = useRef(null);

    useEffect(() => {
        if (overviewRef.current) {
            setIsTruncated(overviewRef.current.scrollHeight > overviewRef.current.clientHeight);
        }
    }, [media?.overview]);

    // Change posters
    const [changingPosterType, setChangingPosterType] = useState(null);
    const [newPosterUrls, setNewPosterUrls] = useState({
        poster: media?.rawPosterUrl,
        backdrop: media?.rawBackdropUrl,
        logo: media?.rawLogoUrl
    });

    useEffect(() => {
        setNewPosterUrls({
            poster: media?.rawPosterUrl,
            backdrop: media?.rawBackdropUrl,
            logo: media?.rawLogoUrl
        });
    }, [media?.rawPosterUrl, media?.rawBackdropUrl, media?.rawLogoUrl]);

    const displayPoster = newPosterUrls.poster !== media?.rawPosterUrl && changingPosterType
        ? getImageUrl(newPosterUrls.poster, "w342")
        : media?.posterPath;

    const displayBackdrop = newPosterUrls.backdrop !== media?.rawBackdropUrl && changingPosterType
        ? getImageUrl(newPosterUrls.backdrop, isMobile ? 'w780' : 'original')
        : (media?.backdropPathFull || media?.backdropPath);

    const displayLogo = newPosterUrls.logo !== media?.rawLogoUrl && changingPosterType
        ? getImageUrl(newPosterUrls.logo)
        : media?.logoPath;

    useEffect(() => {
        let timeout;
        const scrollContainer = containerRef.current?.closest('.overflow-y-auto');

        if (changingPosterType) {
            if (scrollContainer) {
                scrollContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                timeout = setTimeout(() => {
                    scrollContainer.style.overflow = 'hidden';
                }, 600);
            }
        } else {
            if (scrollContainer) {
                scrollContainer.style.overflow = '';
            }
        }

        return () => {
            clearTimeout(timeout);
            if (scrollContainer) {
                scrollContainer.style.overflow = '';
            }
        };
    }, [changingPosterType]);

    // Trailer
    const [trailerPlaying, setTrailerPlaying] = useState(false);
    useEffect(() => {
        setTrailerPlaying(false);
    }, [media?.trailerKey]);

    if (!media) return (
        <div className="flex items-center justify-center h-full text-white">
            <h2>Movie not found!</h2>
            <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );

    const contextValue = {
        media,
        tmdbId,
        navigate,
        history,
        historyLoaded,
        setProgressAndSave,
        movieGenres,
        tvGenres,
        activeModal,
        setActiveModal,
        activeTab,
        setActiveTab,
        isOverviewExpanded,
        setIsOverviewExpanded,
        isTruncated,
        overviewRef,
        changingPosterType,
        setChangingPosterType,
        newPosterUrls,
        setNewPosterUrls,
        displayPoster,
        displayBackdrop,
        displayLogo,
        trailerPlaying,
        setTrailerPlaying,
        containerRef
    };

    return (
        <MediaDetailsContext.Provider value={contextValue}>
            <motion.div ref={containerRef} className={`w-full min-h-full flex flex-col items-center relative z-50 ${className}`}>
                {isMobile ? 
                    <MobileMediaDetails /> : 
                    <DesktopMediaDetails />
                }
            </motion.div>
        </MediaDetailsContext.Provider>
    );
}
