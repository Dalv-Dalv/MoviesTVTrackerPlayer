import { AnimatePresence, motion } from 'framer-motion';
import { MovieImage } from '../../shared/components/MovieImage';
import { ArrowLeftIcon, ArrowCircleDownIcon, CaretRightIcon, CheckIcon, ClockCounterClockwiseIcon, DotsThreeVerticalIcon, InfoIcon, MagnifyingGlassIcon, PlayIcon, PlusIcon, TrashIcon, UserIcon } from '@phosphor-icons/react';
import { Dropdown } from '../../shared/components/Dropdown';
import { useGenres } from '../../shared/contexts/GenresContext';
import { getResumeEpisode, useWatchHistoryStore } from '../../shared/store/useWatchHistoryStore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatRuntime } from '../../shared/utils/PlayerUtils';
import { FixMatchModal } from '../../desktop/components/FixMatchModal';
import { Modal } from '../../shared/components/Modal';
import { RemoveMediaModal } from '../../desktop/components/RemoveMediaModal';
import { FileInfoModal } from '../../desktop/components/FileInfoModal';
import { useLibraryStore } from '../../shared/store/useLibraryStore';
import { useLongPress } from '../../shared/hooks/useLongPress';

function TabsButton({ name, onClick, isSelected = false, className = '' }) {
    return (
        <div
            className={`relative first:rounded-l-full last:rounded-r-full p-2 noselect cursor-pointer text-body flex-1 ${className} transition-colors font-semibold ${isSelected ? '' : 'text-muted'} group`}
            onClick={onClick}
        >
            <div
                className={`absolute -inset-x-40 h-[200%] bg-[radial-gradient(circle_520px_at_50%_325px,white_50%,transparent_60%)] opacity-15 group-hover:opacity-20 group-active:opacity-30 transition-[opacity,translate] group-hover:-translate-y-2 duration-300 pointer-events-none
                ${isSelected ? 'opacity-35 group-hover:opacity-40 -translate-y-2 group-hover:-translate-y-2.5' : 'translate-y-4'}`}
            />

            <span className='relative z-10'>
                {name}
            </span>
        </div>
    )
}

function SeasonSection({ season, navigate, tmdbId, className = '' }) {
    const [isExpanded, setIsExpanded] = useState(season.isLastWatched);
    const [isAnimating, setIsAnimating] = useState(false);

    return (
        <div className={`rounded-2xl text-lg ${className}`}>
            <div
                className='relative px-4 py-2 flex items-center gap-4 rounded-lg'
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CaretRightIcon
                    size={20}
                    weight='bold'
                    className={`text-muted transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                />
                <span>{season.name}</span>
            </div>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className={isAnimating || !isExpanded ? "overflow-hidden" : ""}
                        onAnimationStart={() => setIsAnimating(true)}
                        onAnimationComplete={() => setIsAnimating(false)}
                    >
                        <div className="ml:p-4">
                            <div className="flex flex-col gap-2 ml:gap-4 -mx-1">
                                {season.episodes.map((episode, index) => (
                                    <EpisodeCard
                                        key={`season_${season.number}_episode_${episode.number}`}
                                        episode={episode}
                                        navigate={navigate}
                                        tmdbId={tmdbId}
                                        seasonNumber={season.number}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function EpisodeCard({ episode, tmdbId, seasonNumber, navigate, className = '' }) {
    const toggleManualCompletion = useWatchHistoryStore(state => state.toggleManualCompletion);
    const updateEpisodeFile = useLibraryStore(state => state.updateEpisodeFile);
    const removeEpisodeFile = useLibraryStore(state => state.removeEpisodeFile);

    const watchProgressRatio = !episode.history ? 0 : (episode.history.completed ? 1 : episode.history.progress / episode.history.duration);


    const handleFixMatch = async () => {
        try {
            const selected = await open({
                multiple: true,
                filters: [{ name: 'Video', extensions: ['mkv', 'mp4', 'avi', 'webm', 'mov'] }]
            });
            if (selected && selected.length > 0) {
                await updateEpisodeFile(tmdbId, seasonNumber, episode.number, selected);
            }
        } catch (e) {
            console.error("Failed to select file", e);
        }
    };

    return (
        <Dropdown
            usePortal={true}
            dropdownClassName="min-w-32"
            Trigger={({ isOpen, toggle }) => {
                const bindLongPress = useLongPress(() => {
                    if (!isOpen) {
                        window.dispatchEvent(new CustomEvent('closeAllDropdowns'));
                        setTimeout(() => toggle(), 0);
                    }
                }, {
                    delay: 500,
                    cancelOnMovement: true,
                });

                return (
                    <div 
                        className={`relative grid grid-cols-[auto_1fr] gap-3 gap-y-2 w-full p-2 rounded-2xl transition-colors duration-300 cursor-pointer ${className} ${isOpen ? 'bg-white/10' : 'active:bg-white/5'}`}
                        style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'pan-y' }}
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={(e) => {
                            if (isOpen) {
                                e.preventDefault();
                                e.stopPropagation();
                                toggle();
                            } else if (episode.isDownloaded) {
                                navigate(`/play/${tmdbId}?s=${seasonNumber}&e=${episode.number}`);
                            }
                        }}
                        {...bindLongPress()}
                    >
                        <div className='relative z-20'>
                            {/* Thubmnail */}
                            <div className={`relative ml:h-35 mp:w-35 bg-background rounded-xl overflow-hidden cursor-pointer`}>
                                <img src={episode.stillPath} className='h-full rounded-xl pointer-events-none' />

                                {watchProgressRatio > 0 && (
                                    <div className='absolute bottom-0 inset-x-0 h-1 rounded-full mb-2 mx-3 overflow-hidden pointer-events-none'>
                                        <div className="absolute rounded-full inset-0 bg-white/30 group-hover:bg-white/70 transition-colors duration-300 pointer-events-none mix-blend-soft-light" />
                                        <div className='relative z-10 h-full rounded-full bg-primary' style={{ width: `${watchProgressRatio * 100}%` }} />
                                        <div className="absolute z-20 rounded-full inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                                    </div>
                                )}

                                <div className="absolute rounded-xl inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                            </div>
                        </div>

                        <div className='relative z-20 pr-8 flex flex-col flex-1 justify-center gap-1 pointer-events-none'>
                            <span className='text-[0.95rem]'>
                                {episode.name && `${episode.number}. `}
                                {episode.name || `Episode ${episode.number}`}
                            </span>

                            <p className='text-muted text-sm mp:hidden'>
                                {episode.overview}
                            </p>

                            <span className='text-muted text-sm'>
                                {episode.runtime}m
                            </span>
                        </div>

                        <div className='ml:hidden col-span-2 pointer-events-none px-1'>
                            <p className='text-muted text-sm'>
                                {episode.overview}
                            </p>
                        </div>

                        {episode.isDownloaded && (
                            <div className='absolute top-4 right-4 z-30 pointer-events-none flex items-center justify-center p-2 text-muted'>
                                <ArrowCircleDownIcon size={24} weight='fill' />
                            </div>
                        )}
                    </div>
                );
            }}
        >
            {({ close }) => (
                <>
                    <button
                        onClick={() => { toggleManualCompletion(tmdbId, seasonNumber, episode.number); close(); }}
                        className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
                    >
                        <CheckIcon size={20} weight="bold" />
                        <span>{episode.history?.completed ? 'Mark as unwatched' : 'Mark as watched'}</span>
                    </button>
                    <button
                        onClick={() => { handleFixMatch(); close(); }}
                        className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
                    >
                        <MagnifyingGlassIcon size={20} weight="bold" />
                        <span>Fix match</span>
                    </button>

                    <button
                        onClick={() => { useWatchHistoryStore.getState().setProgressAndSave(tmdbId, 0, seasonNumber, episode.number); close(); }}
                        className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300'
                    >
                        <ClockCounterClockwiseIcon size={20} weight="bold" />
                        <span>Reset watch time</span>
                    </button>

                    {episode.isDownloaded && (
                        <button
                            onClick={() => { removeEpisodeFile(tmdbId, seasonNumber, episode.number, false); close(); }}
                            className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300'
                        >
                            <TrashIcon size={20} weight="bold" />
                            <span>Remove file</span>
                        </button>
                    )}
                </>
            )}
        </Dropdown>
    )
}

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

export function MobileMediaDetails({ media: rawMedia, tmdbId, navigate }) {
    const history = useWatchHistoryStore(state => state.history[tmdbId]);
    const historyLoaded = useWatchHistoryStore(state => state.isLoaded);
    const setProgressAndSave = (progress) => useWatchHistoryStore.getState().setProgressAndSave(tmdbId, progress);

    const { movieGenres, tvGenres } = useGenres();
    const [activeModal, setActiveModal] = useState(null);
    const [activeTab, setAcitveTab] = useState(() => getSavedTab(tmdbId, rawMedia?.type));
    const prevTmdbId = useRef(tmdbId);
    const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const overviewRef = useRef(null);

    if (tmdbId !== prevTmdbId.current) {
        prevTmdbId.current = tmdbId;
        setAcitveTab(getSavedTab(tmdbId, rawMedia?.type));
    }

    const [trailerPlaying, setTrailerPlaying] = useState(false);

    useEffect(() => {
        if (activeTab === 'episodes' && rawMedia?.type !== 'show') {
            setAcitveTab('details');
        } else {
            saveTab(tmdbId, activeTab);
        }
    }, [activeTab, rawMedia?.type, tmdbId]);

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

    useEffect(() => {
        if (overviewRef.current) {
            setIsTruncated(overviewRef.current.scrollHeight > overviewRef.current.clientHeight);
        }
    }, [media?.overview]);

    useEffect(() => {
        setTrailerPlaying(false);
    }, [media?.trailerKey]);

    if (!media) return null;

    let playButtonText = 'Play';
    if (historyLoaded) {
        if (media.type === 'show' && history?.lastPlayedSeason != null) {
            const resumeData = getResumeEpisode(history, rawMedia);
            if (resumeData) {
                playButtonText = `Resume S${resumeData.season} E${resumeData.episode}`;
            }
        } else if (media.type === 'movie' && history?.progress > 0 && !history?.completed) {
            playButtonText = 'Resume';
        }
    }

    const releaseYear = media?.releaseDate?.split('-')[0] || 'Unknown Year';
    const runtimeText = media?.type === 'movie' ? `${formatRuntime(media.runtime)}` : `${media.seasons.length} Seasons`;
    console.log(media);

    return (
        <div className="w-full flex flex-col gap-6 pb-12 relative z-10 bg-background overflow-hidden">
            <div className='relative w-full shrink-0 top-0 ml:max-h-[90dvh] overflow-hidden pointer-events-none noselect flex justify-center'>
                <MovieImage
                    relativePath={media.backdropPath}
                    className='w-[120%] max-w-none shrink-0 pointer-events-none'
                />

                <div className='absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,black_100%)]'/>
            </div>

            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="fixed top-10 left-4 z-50 text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body transition-colors 
                bg-black/10 active:bg-black/0 rounded-full px-3 py-2 noselect backdrop-blur-md"
            >
                <ArrowLeftIcon size={25} weight='bold' />
            </button>

            <div className='relative z-20 text-body px-4 ml:px-6 -mt-6 ml:-mt-4 flex flex-col gap-4'>
                <div className="flex w-full items-start justify-between gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                        <h1 className="text-2xl font-bold tracking-wide">
                            {media.title}
                        </h1>

                        <div className='text-sm text-muted flex gap-2'>
                            <span>{releaseYear}</span>
                            <span>{runtimeText}</span>
                        </div>

                        <div className='flex items-center gap-1 noselect text-sm text-muted w-full -mt-2'>
                            {(media.genreIds || media.genres || []).map((id, index, arr) => {
                                const dict = media.type === 'show' ? tvGenres : movieGenres;
                                const text = dict[id] || id;
                                return (
                                    <div key={id} className='flex items-center gap-1 tracking-wide shrink-0 whitespace-nowrap'>
                                        <span>{text}</span>
                                        {index < arr.length - 1 && <span className='opacity-60'>•</span>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <Dropdown
                        usePortal={true}
                        dropdownClassName="min-w-32"
                        Trigger={({ isOpen, toggle }) => (
                            <button
                                onClick={toggle}
                                className={`text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-4xl px-3 py-2 noselect pointer-events-auto
                                        transition-all duration-300 ${isOpen ? '-rotate-90 bg-black/50 rounded-l-2xl hover:bg-black/60' : 'rotate-0'}`}
                            >
                                <DotsThreeVerticalIcon size={26} weight="bold" />
                            </button>
                        )}
                    >
                        {({ close }) => (
                            <>
                                <button
                                    onClick={() => { setActiveModal('FIX_MATCH'); close(); }}
                                    className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
                                >
                                    <MagnifyingGlassIcon size={20} weight="bold" />
                                    <span>Fix Match</span>
                                </button>

                                <button
                                    onClick={() => { setActiveModal('FILE_INFO'); close(); }}
                                    className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
                                >
                                    <InfoIcon size={20} weight="bold" />
                                    <span>View Files Info</span>
                                </button>

                                <button
                                    onClick={() => { setActiveModal('CONFIRM_RESET'); close(); }}
                                    className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300'
                                >
                                    <ClockCounterClockwiseIcon size={20} weight="bold" />
                                    <span>Reset Watch Time</span>
                                </button>

                                <button
                                    onClick={() => { setActiveModal('CONFIRM_REMOVE'); close(); }}
                                    className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300'
                                >
                                    <TrashIcon size={20} weight="bold" />
                                    <span>Remove from Library</span>
                                </button>
                            </>
                        )}
                    </Dropdown>
                </div>

                <div className='flex w-full gap-4 items-center'>
                    <button
                        onClick={() => navigate(`/play/${tmdbId}`)}
                        className="bg-body text-black px-4 py-2 rounded-full w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:bg-body/90"
                    >
                        <PlayIcon size={20} weight='fill' />
                        <span>{playButtonText}</span>
                    </button>
                    <button
                        onClick={() => navigate(`/play/${tmdbId}`)}
                        className="text-muted px-2 py-2 rounded-full w-fit font-semibold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors bg-transparent hover:bg-black/40 hover:text-body"
                    >
                        <PlusIcon size={20} weight='bold' />
                        <span>Watch list</span>
                    </button>
                </div>
                
                <div className="flex flex-col mb-2 text-muted ">
                    <p ref={overviewRef} className={`text-justify indent-4 ${!isOverviewExpanded ? 'line-clamp-4' : ''}`}>
                        {media.overview}
                    </p>
                    {isTruncated && (
                        <button 
                            onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                            className="italic font-semibold hover:underline self-start mt-1"
                        >
                            {isOverviewExpanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </div>

                {/* Tabs and Content below */}
                <div className="w-full flex flex-col pb-8">
                    <div className='relative mb-4 w-full flex justify-stretch items-center text-center rounded-full border border-transparent overflow-hidden bg-black mix-blend-screen'>
                        <TabsButton name={'Details'} isSelected={activeTab === 'details'} onClick={() => setAcitveTab('details')} />
                        {media.type === 'show' && (
                            <TabsButton name={'Episodes'} isSelected={activeTab === 'episodes'} onClick={() => setAcitveTab('episodes')} />
                        )}
                        <TabsButton name={'Cast'} isSelected={activeTab === 'cast'} onClick={() => setAcitveTab('cast')} />
                        <div className="absolute inset-0 pointer-events-none mix-blend-overlay rounded-full border border-x-2 border-white" />
                    </div>

                    {activeTab === 'details' && media.trailerKey && (
                        <div className="w-full aspect-video relative z-50 pointer-events-auto group">
                            {!trailerPlaying ? (
                                <div
                                    className="w-full h-full relative cursor-pointer"
                                    onClick={() => setTrailerPlaying(true)}
                                >
                                    <img
                                        src={`https://img.youtube.com/vi/${media.trailerKey}/maxresdefault.jpg`}
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://img.youtube.com/vi/${media.trailerKey}/hqdefault.jpg`; }}
                                        alt="Trailer Thumbnail"
                                        className='absolute inset-0 blur-lg opacity-50 rounded-2xl -z-10'
                                    />

                                    <img
                                        src={`https://img.youtube.com/vi/${media.trailerKey}/maxresdefault.jpg`}
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://img.youtube.com/vi/${media.trailerKey}/hqdefault.jpg`; }}
                                        alt="Trailer Thumbnail"
                                        className="w-full h-full object-cover block rounded-2xl"
                                    />

                                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center transition-colors">
                                        <div className="bg-black/60 backdrop-blur-sm rounded-full p-3 text-body transition-opacity duration-300">
                                            <PlayIcon size={24} weight="fill" />
                                        </div>
                                    </div>

                                    <div className="absolute rounded-[15px] ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                                    <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/8 pointer-events-none" />
                                </div>
                            ) : (
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${media.trailerKey}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&vq=hd1080`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            )}
                        </div>
                    )}

                    {activeTab === 'episodes' && (
                        <div className='flex flex-col gap-2 text-body noselect'>
                            {media.seasons && media.seasons.filter(season => season.episodes && season.episodes.length > 0).map((season) => (
                                <SeasonSection key={`season_${season.number}`} season={season} navigate={navigate} tmdbId={tmdbId} />
                            ))}
                        </div>
                    )}
                    
                    {activeTab === 'cast' && (
                        <div className='flex  flex-col gap-4 text-body noselect overflow-hidden w-full'>
                            <div className='flex overflow-x-auto gap-4 pb-4 -mb-4 -mx-4 px-4'>
                                {media?.cast?.map((actor) => (
                                    <div key={actor.id} className="w-28 flex flex-col shrink-0 group snap-start">
                                        
                                        <div className="w-full aspect-2/3 relative rounded-lg overflow-hidden bg-background">
                                            {actor.profilePath ? (
                                                <MovieImage imagePath={actor.profilePath} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <UserIcon size={48} weight="fill" className="text-white/20" />
                                                </div>
                                            )}
                                            
                                            <div className="absolute rounded-lg inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                                        </div>

                                        <div className="flex flex-col mt-1.5 px-1">
                                            <span className="font-medium text-white truncate text-sm" title={actor.name}>
                                                {actor.name}
                                            </span>
                                            <span className="text-xs text-gray-400 truncate" title={actor.character}>
                                                {actor.character}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <FixMatchModal
                isOpen={activeModal === 'FIX_MATCH'}
                onClose={() => setActiveModal(null)}
                media={media}
                tmdbId={tmdbId}
                navigate={navigate}
            />

            <Modal isOpen={activeModal === 'CONFIRM_RESET'} onClose={() => setActiveModal(null)} title="Reset Watch Time">
                <p className="mb-6">Are you sure you want to reset your watch time? This cannot be undone.</p>
                <div className="flex gap-4 justify-end">
                    <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-lg hover:bg-divider transition-colors cursor-pointer">Cancel</button>
                    <button onClick={() => { setActiveModal(null); setProgressAndSave(0) }} className="px-4 py-2 bg-danger-600 text-white rounded-lg font-semibold hover:bg-danger-500 transition-colors cursor-pointer">Reset</button>
                </div>
            </Modal>


            <RemoveMediaModal
                isOpen={activeModal === 'CONFIRM_REMOVE'}
                onClose={() => setActiveModal(null)}
                tmdbId={tmdbId}
                navigate={navigate}
            />

            <FileInfoModal
                isOpen={activeModal === 'FILE_INFO'}
                onClose={() => setActiveModal(null)}
                media={media}
            />
        </div>

        // <div className="w-full flex-1 flex flex-col gap-6 items-center overflow-y-auto pb-12 pt-8 relative z-10 overflow-hidden">
        //     {/* Backdrop */}
        //     <div className='absolute left-0 top-0 w-full h-screen pointer-events-none noselect flex items-start ml:mask-[linear-gradient(to_top,transparent_1%,black_60%)]'>
        //         <MovieImage
        //             relativePath={media.backdropPath}
        //             className='origin-top scale-200 ml:scale-100 mp:mask-[linear-gradient(to_top,transparent_1%,black_60%)] pointer-events-none'
        //         />
        //     </div>

        //     {/* Top buttons */}
        //     <div className='fixed top-12 inset-x-6 z-50 flex items-center justify-between gap-2 pointer-events-none'>
        //         <button
        //             onClick={() => navigate(-1)}
        //             className="text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body transition-colors bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-full px-3 py-2 noselect pointer-events-auto"
        //         >
        //             <ArrowLeftIcon size={25} weight='bold' />
        //         </button>

        //         <Dropdown
        //             dropdownClassName="top-[110%] right-0"
        //             Trigger={({ isOpen, toggle }) => (
        //                 <button
        //                     onClick={toggle}
        //                     className={`text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-4xl px-3 py-2 noselect pointer-events-auto
        //                             transition-all duration-300 ${isOpen ? '-rotate-90 bg-black/50 rounded-l-2xl hover:bg-black/60' : 'rotate-0'}`}
        //                 >
        //                     <DotsThreeVerticalIcon size={26} weight="bold" />
        //                 </button>
        //             )}
        //         >
        //             {({ close }) => (
        //                 <>
        //                     <button
        //                         onClick={() => { setActiveModal('FIX_MATCH'); close(); }}
        //                         className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
        //                     >
        //                         <MagnifyingGlassIcon size={20} weight="bold" />
        //                         <span>Fix Match</span>
        //                     </button>

        //                     <button
        //                         onClick={() => { setActiveModal('FILE_INFO'); close(); }}
        //                         className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
        //                     >
        //                         <InfoIcon size={20} weight="bold" />
        //                         <span>View Files Info</span>
        //                     </button>

        //                     <button
        //                         onClick={() => { setActiveModal('CONFIRM_RESET'); close(); }}
        //                         className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300'
        //                     >
        //                         <ClockCounterClockwiseIcon size={20} weight="bold" />
        //                         <span>Reset Watch Time</span>
        //                     </button>

        //                     <button
        //                         onClick={() => { setActiveModal('CONFIRM_REMOVE'); close(); }}
        //                         className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300'
        //                     >
        //                         <TrashIcon size={20} weight="bold" />
        //                         <span>Remove from Library</span>
        //                     </button>
        //                 </>
        //             )}
        //         </Dropdown>
        //     </div>
        //     {/* --- PORTRAIT LAYOUT --- */}
        //     <div className="w-full ml:hidden flex flex-col">
        //         {/* 100dvh viewport for poster and details */}
        //         <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center gap-8 px-8 py-24">
        //             <div className="w-full max-w-[65%] shrink-0 relative flex justify-center items-center">
        //                 <MovieImage
        //                     relativePath={media.posterPath}
        //                     altText={media.title}
        //                     className='w-full absolute blur-2xl opacity-50'
        //                 />
        //                 <div className="relative z-10 w-full aspect-[2/3] rounded-2xl shadow-2xl shadow-black/50 bg-neutral-900 overflow-hidden">
        //                     <MovieImage
        //                         relativePath={media.posterPath}
        //                         altText={media.title}
        //                         className='w-full h-full object-cover block'
        //                     />
        //                     <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
        //                     <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/8 pointer-events-none" />
        //                 </div>
        //             </div>

        //             <div className='w-full text-body flex flex-col gap-6 items-center'>
        //                 <h1 className="text-3xl font-bold tracking-wide text-center">
        //                     {media.title}
        //                 </h1>
        //                 <div className='w-full flex justify-center gap-6 text-muted font-semibold'>
        //                     <span>{releaseYear}</span>
        //                     <span>{runtimeText}</span>
        //                 </div>
        //                 <div className='flex flex-col w-full gap-4 items-center'>
        //                     <button
        //                         onClick={() => navigate(`/play/${tmdbId}`)}
        //                         className="bg-body text-black px-6 py-3 rounded-full w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:bg-body/90"
        //                     >
        //                         <PlayIcon size={20} weight='fill' />
        //                         <span>{playButtonText}</span>
        //                     </button>
        //                     <button
        //                         onClick={() => navigate(`/play/${tmdbId}`)}
        //                         className="text-muted px-4 py-3 rounded-full w-fit font-semibold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors bg-transparent hover:bg-black/40 hover:text-body"
        //                     >
        //                         <PlusIcon size={20} weight='bold' />
        //                         <span>Add to watch list</span>
        //                     </button>
        //                 </div>
        //             </div>
        //         </div>

        //         {/* Tabs and Content below */}
        //         <div className="w-full flex flex-col px-4 gap-6 pb-8">
        //             <div className='relative w-full flex justify-stretch items-center text-center rounded-full border border-transparent overflow-hidden bg-black mix-blend-screen'>
        //                 <TabsButton name={'Details'} isSelected={activeTab === 'details'} onClick={() => setAcitveTab('details')} />
        //                 {media.type === 'show' && (
        //                     <TabsButton name={'Episodes'} isSelected={activeTab === 'episodes'} onClick={() => setAcitveTab('episodes')} />
        //                 )}
        //                 <TabsButton name={'Cast'} isSelected={activeTab === 'cast'} onClick={() => setAcitveTab('cast')} />
        //                 <div className="absolute inset-0 pointer-events-none mix-blend-overlay rounded-full border border-x-2 border-white" />
        //             </div>

        //             {activeTab === 'details' && (
        //                 <div className='text-left'>
        //                     <p className="text-muted text-justify indent-4">
        //                         {media.overview}
        //                     </p>
        //                 </div>
        //             )}

        //             {activeTab === 'details' && media.trailerKey && (
        //                 <div className="w-full aspect-video relative z-50 pointer-events-auto group">
        //                     {!trailerPlaying ? (
        //                         <div
        //                             className="w-full h-full relative cursor-pointer"
        //                             onClick={() => setTrailerPlaying(true)}
        //                         >
        //                             <img
        //                                 src={`https://img.youtube.com/vi/${media.trailerKey}/maxresdefault.jpg`}
        //                                 onError={(e) => { e.target.onerror = null; e.target.src = `https://img.youtube.com/vi/${media.trailerKey}/hqdefault.jpg`; }}
        //                                 alt="Trailer Thumbnail"
        //                                 className='absolute inset-0 blur-lg opacity-50 rounded-2xl -z-10'
        //                             />

        //                             <img
        //                                 src={`https://img.youtube.com/vi/${media.trailerKey}/maxresdefault.jpg`}
        //                                 onError={(e) => { e.target.onerror = null; e.target.src = `https://img.youtube.com/vi/${media.trailerKey}/hqdefault.jpg`; }}
        //                                 alt="Trailer Thumbnail"
        //                                 className="w-full h-full object-cover block rounded-2xl"
        //                             />

        //                             <div className="absolute inset-0 rounded-2xl flex items-center justify-center transition-colors">
        //                                 <div className="bg-black/60 backdrop-blur-sm rounded-full p-3 text-body transition-opacity duration-300">
        //                                     <PlayIcon size={24} weight="fill" />
        //                                 </div>
        //                             </div>

        //                             <div className="absolute rounded-[15px] ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
        //                             <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/8 pointer-events-none" />
        //                         </div>
        //                     ) : (
        //                         <iframe
        //                             className="w-full h-full"
        //                             src={`https://www.youtube.com/embed/${media.trailerKey}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&vq=hd1080`}
        //                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        //                             allowFullScreen
        //                         ></iframe>
        //                     )}
        //                 </div>
        //             )}

        //             {activeTab === 'episodes' && (
        //                 <div className='flex flex-col gap-2 text-body noselect'>
        //                     {media.seasons && media.seasons.filter(season => season.episodes && season.episodes.length > 0).map((season) => (
        //                         <SeasonSection key={`season_${season.number}`} season={season} navigate={navigate} tmdbId={tmdbId} />
        //                     ))}
        //                 </div>
        //             )}
        //         </div>
        //     </div>

        //     {/* --- LANDSCAPE LAYOUT --- */}
        //     <div className='w-full relative hidden ml:grid grid-cols-[min(33vw,16rem)_minmax(0,1fr)] gap-8 pr-12 pb-12'>
        //         {/* Poster Column */}
        //         <div className='w-full h-full relative pl-12 pt-[calc(100dvh+1.5rem-min(33vw,16rem)*1.5)] noselect'>
        //             <motion.div
        //                 initial={{ opacity: 0, scale: 0.9 }}
        //                 animate={{ opacity: 1, scale: 1 }}
        //                 className="w-full z-10 sticky top-22"
        //             >
        //                 <MovieImage
        //                     relativePath={media.posterPath}
        //                     altText={media.title}
        //                     className='absolute w-full blur-2xl opacity-50'
        //                 />

        //                 <div className="relative z-10 w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-neutral-900">
        //                     <MovieImage
        //                         relativePath={media.posterPath}
        //                         altText={media.title}
        //                         className='w-full h-full object-cover block'
        //                     />
        //                     <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
        //                     <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/8 pointer-events-none" />
        //                 </div>
        //             </motion.div>
        //         </div>

        //         {/* Right Column */}
        //         <div className='w-full h-full min-w-0'>
        //             <div className='flex flex-col h-[100dvh] justify-end pb-8 text-body relative z-10'>
        //                 <h1 className="text-4xl font-bold tracking-wide">
        //                     {media.title}
        //                 </h1>

        //                 <div className='text-muted font-semibold flex gap-4 mt-2'>
        //                     <span>{releaseYear}</span>
        //                     <span>{runtimeText}</span>
        //                 </div>

        //                 <div className='flex gap-4 noselect mt-6'>
        //                     <button
        //                         onClick={() => navigate(`/play/${tmdbId}`)}
        //                         className="bg-body text-black px-6 py-3 rounded-full w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:bg-body/90"
        //                     >
        //                         <PlayIcon size={20} weight='fill' />
        //                         <span>{playButtonText}</span>
        //                     </button>

        //                     <button
        //                         onClick={() => navigate(`/play/${tmdbId}`)}
        //                         className="text-muted px-4 py-3 rounded-full w-fit font-semibold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors bg-transparent hover:bg-black/40 hover:text-body"
        //                     >
        //                         <PlusIcon size={20} weight='bold' />
        //                         <span>Add to watch list</span>
        //                     </button>
        //                 </div>
        //             </div>

        //             <div className="w-full flex flex-col gap-6">
        //                 <div className='relative w-full max-w-[80%] flex justify-stretch items-center text-center rounded-full border border-transparent overflow-hidden bg-black mix-blend-screen'>
        //                     <TabsButton name={'Details'} isSelected={activeTab === 'details'} onClick={() => setAcitveTab('details')} />
        //                     {media.type === 'show' && (
        //                         <TabsButton name={'Episodes'} isSelected={activeTab === 'episodes'} onClick={() => setAcitveTab('episodes')} />
        //                     )}
        //                     <TabsButton name={'Cast'} isSelected={activeTab === 'cast'} onClick={() => setAcitveTab('cast')} />
        //                     <div className="absolute inset-0 pointer-events-none mix-blend-overlay rounded-full border border-x-2 border-white" />
        //                 </div>

        //                 {activeTab === 'details' && (
        //                     <div className='text-left'>
        //                         <p className="text-muted text-justify indent-4 max-w-[80%]">
        //                             {media.overview}
        //                         </p>
        //                     </div>
        //                 )}

        //                 {activeTab === 'details' && media.trailerKey && (
        //                     <div className="w-full max-w-[80%] aspect-video relative z-50 pointer-events-auto group">
        //                         {!trailerPlaying ? (
        //                             <div
        //                                 className="w-full h-full relative cursor-pointer"
        //                                 onClick={() => setTrailerPlaying(true)}
        //                             >
        //                                 <img
        //                                     src={`https://img.youtube.com/vi/${media.trailerKey}/maxresdefault.jpg`}
        //                                     onError={(e) => { e.target.onerror = null; e.target.src = `https://img.youtube.com/vi/${media.trailerKey}/hqdefault.jpg`; }}
        //                                     alt="Trailer Thumbnail"
        //                                     className='absolute inset-0 blur-lg opacity-50 rounded-2xl -z-10'
        //                                 />

        //                                 <img
        //                                     src={`https://img.youtube.com/vi/${media.trailerKey}/maxresdefault.jpg`}
        //                                     onError={(e) => { e.target.onerror = null; e.target.src = `https://img.youtube.com/vi/${media.trailerKey}/hqdefault.jpg`; }}
        //                                     alt="Trailer Thumbnail"
        //                                     className="w-full h-full object-cover block rounded-2xl"
        //                                 />

        //                                 <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
        //                                     <div className="bg-black/60 backdrop-blur-sm rounded-full p-3 text-body transition-opacity duration-300">
        //                                         <PlayIcon size={32} weight="fill" />
        //                                     </div>
        //                                 </div>

        //                                 <div className="absolute rounded-[15px] ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
        //                                 <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/8 pointer-events-none" />
        //                             </div>
        //                         ) : (
        //                             <iframe
        //                                 className="w-full h-full"
        //                                 src={`https://www.youtube.com/embed/${media.trailerKey}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&vq=hd1080`}
        //                                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        //                                 allowFullScreen
        //                             ></iframe>
        //                         )}
        //                     </div>
        //                 )}

        //                 {activeTab === 'episodes' && (
        //                     <div className='flex flex-col gap-2 text-body pr-4 noselect'>
        //                         {media.seasons && media.seasons.filter(season => season.episodes && season.episodes.length > 0).map((season) => (
        //                             <SeasonSection key={`season_${season.number}`} season={season} navigate={navigate} tmdbId={tmdbId} />
        //                         ))}
        //                     </div>
        //                 )}
        //             </div>
        //         </div>
        //     </div>

        //     {/* Modals */}
        //     <FixMatchModal
        //         isOpen={activeModal === 'FIX_MATCH'}
        //         onClose={() => setActiveModal(null)}
        //         media={media}
        //         tmdbId={tmdbId}
        //         navigate={navigate}
        //     />

        //     <Modal isOpen={activeModal === 'CONFIRM_RESET'} onClose={() => setActiveModal(null)} title="Reset Watch Time">
        //         <p className="mb-6">Are you sure you want to reset your watch time? This cannot be undone.</p>
        //         <div className="flex gap-4 justify-end">
        //             <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-lg hover:bg-divider transition-colors cursor-pointer">Cancel</button>
        //             <button onClick={() => { setActiveModal(null); setProgressAndSave(0) }} className="px-4 py-2 bg-danger-600 text-white rounded-lg font-semibold hover:bg-danger-500 transition-colors cursor-pointer">Reset</button>
        //         </div>
        //     </Modal>


        //     <RemoveMediaModal
        //         isOpen={activeModal === 'CONFIRM_REMOVE'}
        //         onClose={() => setActiveModal(null)}
        //         tmdbId={tmdbId}
        //         navigate={navigate}
        //     />

        //     <FileInfoModal
        //         isOpen={activeModal === 'FILE_INFO'}
        //         onClose={() => setActiveModal(null)}
        //         media={media}
        //     />
        // </div>
    );
}
