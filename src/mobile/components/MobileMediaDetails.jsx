import { AnimatePresence, motion } from 'framer-motion';
import { MediaImage } from '../../shared/components/MediaImage';
import { ProfileImage } from '../../shared/components/ProfileImage';
import { ArrowLeftIcon, ArrowCircleDownIcon, CaretRightIcon, CaretDownIcon, CheckIcon, ClockCounterClockwiseIcon, DotsThreeVerticalIcon, InfoIcon, MagnifyingGlassIcon, PlayIcon, PlusIcon, TrashIcon, UserIcon, ImageSquareIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { Dropdown } from '../../shared/components/Dropdown';
import { useGenres } from '../../shared/contexts/GenresContext';
import { getResumeEpisode, useWatchHistoryStore } from '../../shared/store/useWatchHistoryStore';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useMediaData } from '../../shared/hooks/useMediaData';
import { ExpandableText } from '../../shared/components/ExpandableText';
import { getImageUrl } from '../../shared/services/TMDBMetadata';
import { formatRuntime } from '../../shared/utils/PlayerUtils';
import { FixMatchModal } from '../../shared/components/FixMatchModal';
import { Modal } from '../../shared/components/Modal';
import { RemoveMediaModal } from '../../shared/components/RemoveMediaModal';
import { FileInfoModal } from '../../shared/components/FileInfoModal';
import { ChangePostersPanel } from '../../shared/components/ChangePostersPanel';
import { CustomTrailerPlayer } from '../../shared/components/CustomTrailerPlayer';
import { useLibraryStore } from '../../shared/store/useLibraryStore';
import { useLongPress } from '../../shared/hooks/useLongPress';
import RingGlow from '../../shared/components/RingGlow';

const TAB_STORAGE_KEY = 'desktopMediaDetailsTabs';
const MAX_STORED_TABS = 50;

function getSavedTab(compId, mediaType) {
    try {
        const stored = JSON.parse(localStorage.getItem(TAB_STORAGE_KEY) || '{}');
        const saved = stored[compId]?.tab;
        if (saved === 'episodes' && mediaType !== 'show') return 'details';
        return saved || 'details';
    } catch {
        return 'details';
    }
}

function saveTab(compId, tab) {
    try {
        const stored = JSON.parse(localStorage.getItem(TAB_STORAGE_KEY) || '{}');
        stored[compId] = { tab, ts: Date.now() };

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

function TabsButton({ name, onClick, isSelected = false, className = '' }) {
    return (
        <div
            className={`relative p-2 noselect cursor-pointer text-body flex-1 ${className} transition-colors font-semibold ${isSelected ? '' : 'text-muted'} group`}
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



function SeasonTrigger({ isOpen, toggle, currentSeason }) {
    return (
        <div
            onClick={toggle}
            className='text-xl w-fit flex items-center gap-2 noselect cursor-pointer group'
        >
            <h2 className='text-body font-semibold'>
                {currentSeason.name}
            </h2>
            <CaretDownIcon className={`inline text-muted transition-all duration-300 group-hover:text-body ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
        </div>
    );
}

function EpisodeTrigger({ isOpen, toggle, episode, compId, seasonNumber, navigate, watchProgressRatio, imgLoaded, setImgLoaded, className }) {
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
                    navigate(`/play/${compId}?s=${seasonNumber}&e=${episode.number}`);
                }
            }}
            {...bindLongPress()}
        >
            <div className='relative z-20'>
                {/* Thubmnail */}
                <div className={`relative isolate shrink-0 ml:w-48 mp:w-36 aspect-video bg-background rounded-xl overflow-hidden cursor-pointer`}>
                    <div className="absolute inset-0 bg-neutral-800/50 animate-pulse" />
                    <img
                        src={episode.stillPath}
                        className={`relative w-full h-full object-cover rounded-xl pointer-events-none transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImgLoaded(true)}
                    />

                    {watchProgressRatio > 0 && (
                        <div className='absolute bottom-0 inset-x-0 h-1 rounded-full mb-2 mx-3 overflow-hidden pointer-events-none'>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }} transition={{ delay: 0.2, duration: 0.2 }}
                                className="absolute rounded-full inset-0 bg-white/30 group-hover:bg-white/70 transition-colors duration-300 pointer-events-none mix-blend-soft-light backdrop-blur-sm"
                            />
                            <div className='relative z-10 h-full rounded-full bg-primary' style={{ width: `${watchProgressRatio * 100}%` }} />
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }} transition={{ delay: 0.2, duration: 0.2 }}
                                className="absolute z-20 inset-0 pointer-events-none"
                            >
                                <RingGlow rounded="rounded-full" />
                            </motion.div>
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }} transition={{ delay: 0.2, duration: 0.2 }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        <RingGlow rounded="rounded-xl" />
                    </motion.div>
                </div>
            </div>

            <div className='relative z-20 pr-10 flex flex-col flex-1 justify-center gap-1 pointer-events-none'>
                <span className='text-[0.95rem]'>
                    {episode.name && `${episode.number}. `}
                    {episode.name || `Episode ${episode.number}`}
                </span>

                <p className='text-muted text-sm mp:hidden'>
                    {episode.overview}
                </p>

                <span className='text-muted text-sm'>
                    {formatRuntime(episode.runtime)}
                </span>
            </div>

            <div className='ml:hidden col-span-2 pointer-events-none px-1'>
                <p className='text-muted text-sm'>
                    {episode.overview}
                </p>
            </div>

            {episode.isDownloaded && (
                <div className='absolute top-0 h-20 right-2 z-30 pointer-events-none flex items-center justify-center text-muted'>
                    <CheckCircleIcon size={24} weight='fill' />
                </div>
            )}
        </div>
    );
}

function EpisodeCard({ episode, compId, seasonNumber, navigate, className = '' }) {
    const toggleManualCompletion = useWatchHistoryStore(state => state.toggleManualCompletion);
    const updateEpisodeFile = useLibraryStore(state => state.updateEpisodeFile);
    const removeEpisodeFile = useLibraryStore(state => state.removeEpisodeFile);
    const [imgLoaded, setImgLoaded] = useState(false);

    const watchProgressRatio = !episode.history ? 0 : (episode.history.completed ? 1 : episode.history.progress / episode.history.duration);

    const handleFixMatch = async () => {
        try {
            const selected = await open({
                multiple: true,
                filters: [{ name: 'Video', extensions: ['mkv', 'mp4', 'avi', 'webm', 'mov'] }]
            });
            if (selected && selected.length > 0) {
                await updateEpisodeFile(compId, seasonNumber, episode.number, selected);
            }
        } catch (e) {
            console.error("Failed to select file", e);
        }
    };

    return (
        <Dropdown
            usePortal={true}
            dropdownClassName="min-w-32"
            Trigger={EpisodeTrigger}
            triggerProps={{ episode, compId, seasonNumber, navigate, watchProgressRatio, imgLoaded, setImgLoaded, className }}
        >
            {({ close }) => (
                <>
                    <button
                        onClick={() => { toggleManualCompletion(compId, seasonNumber, episode.number); close(); }}
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
                        onClick={() => { useWatchHistoryStore.getState().setProgressAndSave(compId, 0, seasonNumber, episode.number); close(); }}
                        className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300'
                    >
                        <ClockCounterClockwiseIcon size={20} weight="bold" />
                        <span>Reset watch time</span>
                    </button>

                    {episode.isDownloaded && (
                        <button
                            onClick={() => { removeEpisodeFile(compId, seasonNumber, episode.number, false); close(); }}
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

export function MobileMediaDetails({ compId }) {
    const {
        media,
        isLoadingOnline,
        navigate,
        history,
        historyLoaded,
        setProgressAndSave,
        movieGenres,
        tvGenres
    } = useMediaData(compId);
    const [activeModal, setActiveModal] = useState(null);
    const [changingPosterType, setChangingPosterType] = useState(null);
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(null);

    const [posterOverrides, setPosterOverrides] = useState(null);
    const [trailerPlaying, setTrailerPlaying] = useState(false);

    const [prevId, setPrevId] = useState(compId);
    if (compId !== prevId) {
        setPrevId(compId);
        setPosterOverrides(null);
        setTrailerPlaying(false);
    }

    const newPosterUrls = posterOverrides || {
        poster: media?.rawPosterUrl,
        backdrop: media?.rawBackdropUrl,
        logo: media?.rawLogoUrl
    };

    const handleSetNewPosterUrls = (updater) => {
        setPosterOverrides(prev => {
            const current = prev || {
                poster: media?.rawPosterUrl,
                backdrop: media?.rawBackdropUrl,
                logo: media?.rawLogoUrl
            };
            return typeof updater === 'function' ? updater(current) : updater;
        });
    };

    const containerRef = useRef(null);
    useEffect(() => {
        const scrollContainer = containerRef.current?.closest('.overflow-y-auto');

        if (changingPosterType) {
            if (scrollContainer) {
                scrollContainer.style.overflow = 'hidden';
                scrollContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        } else {
            if (scrollContainer) {
                scrollContainer.style.overflow = '';
            }
        }

        return () => {
            if (scrollContainer) {
                scrollContainer.style.overflow = '';
            }
        };
    }, [changingPosterType]);

    if (isLoadingOnline) return (
        <div className="flex flex-col items-center justify-center h-screen w-full text-white bg-background">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-medium">Loading details...</h2>
        </div>
    );

    if (!media) return (
        <div className="flex flex-col items-center justify-center h-screen w-full text-white bg-background">
            <h2 className="text-2xl font-bold mb-4">Media not found!</h2>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-semibold">Go Back</button>
        </div>
    );

    const displayPoster = posterOverrides && posterOverrides.poster !== media?.rawPosterUrl && changingPosterType
        ? getImageUrl(posterOverrides.poster, "w342")
        : media?.posterPath;

    const displayBackdrop = posterOverrides && posterOverrides.backdrop !== media?.rawBackdropUrl && changingPosterType
        ? getImageUrl(posterOverrides.backdrop, 'w780')
        : (media?.backdropPathFull || media?.backdropPath);

    const displayLogo = posterOverrides && posterOverrides.logo !== media?.rawLogoUrl && changingPosterType
        ? getImageUrl(posterOverrides.logo)
        : media?.logoPath;

    const [activeTab, setActiveTab] = useState(() => getSavedTab(compId, media?.type));
    const [isStuck, setIsStuck] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const scrollContainer = containerRef.current?.closest('.overflow-y-auto') || window;

        const handleScroll = () => {
            if (!dropdownRef.current) return;
            const dropdownTop = dropdownRef.current.getBoundingClientRect().top;
            const containerTop = scrollContainer === window ? 0 : scrollContainer.getBoundingClientRect().top;
            setIsStuck(dropdownTop - containerTop <= 82);
        };

        if (activeTab === 'episodes') {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
            handleScroll();
        }

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [activeTab, selectedSeasonNumber]);

    const prevTmdbId = useRef(compId);

    if (compId !== prevTmdbId.current) {
        prevTmdbId.current = compId;
        setActiveTab(getSavedTab(compId, media?.type));
    }

    useEffect(() => {
        if (activeTab === 'episodes' && media?.type !== 'show') {
            setActiveTab('details');
        } else {
            saveTab(compId, activeTab);
        }
    }, [activeTab, media?.type, compId]);

    let playButtonText = 'Play';
    if (historyLoaded) {
        if (media.type === 'show' && history?.lastPlayedSeason != null) {
            const resumeData = getResumeEpisode(history, media);
            if (resumeData) {
                playButtonText = `Resume S${resumeData.season} E${resumeData.episode}`;
            }
        } else if (media.type === 'movie' && history?.progress > 0 && !history?.completed) {
            playButtonText = 'Resume';
        }
    }

    const releaseYear = media?.releaseDate?.split('-')[0] || 'Unknown Year';
    const runtimeText = media?.type === 'movie' ? `${formatRuntime(media.runtime)}` : `${media.seasons.length} Season${media.seasons.length > 1 ? 's' : ''}`;

    const [isTrailerReady, setIsTrailerReady] = useState(false);
    const [minimumTimePassed, setMinimumTimePassed] = useState(false);

    useEffect(() => {
        let timer;
        if (!changingPosterType) {
            timer = setTimeout(() => {
                setMinimumTimePassed(true);
            }, 2000);
        } else {
            setMinimumTimePassed(false);
        }
        return () => clearTimeout(timer);
    }, [changingPosterType]);

    const shouldShowBackdrop = changingPosterType || (!isTrailerReady || !minimumTimePassed) || !media.trailerKey;

    return (
        <div ref={containerRef} className="w-full flex flex-col gap-6 pb-12 relative z-10 bg-background">
            {/* Backdrop & Trailer Container */}
            <div className='relative w-full shrink-0 top-0 ml:max-h-[90dvh] overflow-hidden noselect flex justify-center bg-black'>
                {/* Custom Trailer */}
                {media.trailerKey && (
                    <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${shouldShowBackdrop ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
                        <CustomTrailerPlayer
                            trailerKey={media.trailerKey}
                            isPaused={!!changingPosterType}
                            onReadyToPlay={() => setIsTrailerReady(true)}
                        />
                    </div>
                )}

                {/* Backdrop Image */}
                <MediaImage
                    relativePath={displayBackdrop}
                    className={`w-[120%] max-w-none shrink-0 pointer-events-none transition-all duration-1000 ${changingPosterType === 'backdrop' ? 'scale-101' : 'scale-100'} ${shouldShowBackdrop ? 'opacity-100' : 'opacity-0'}`}
                />

                <div className={`absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,black_100%)] pointer-events-none transition-opacity duration-1000 ${shouldShowBackdrop ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="fixed top-10 left-4 z-60 text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body transition-colors 
                bg-black/10 active:bg-black/0 rounded-full px-3 py-2 noselect backdrop-blur-md"
            >
                <ArrowLeftIcon size={25} weight='bold' />
            </button>

            <div className='z-20 text-body px-4 ml:px-6 -mt-6 ml:-mt-4 flex flex-col gap-4'>
                <div className={`flex w-full items-start justify-between gap-4 transition-opacity duration-300 ${changingPosterType && 'opacity-0 pointer-events-none'}`}>
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
                                    onClick={() => { setChangingPosterType("backdrop"); close(); }}
                                    className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
                                >
                                    <ImageSquareIcon size={20} weight="bold" />
                                    <span>Change posters</span>
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

                <div className={`flex w-full gap-4 items-center transition-opacity duration-300 ${changingPosterType && 'opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={() => navigate(`/play/${compId}`)}
                        className="bg-body text-black px-4 py-2 rounded-full w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:bg-body/90"
                    >
                        <PlayIcon size={20} weight='fill' />
                        <span>{playButtonText}</span>
                    </button>
                    <button
                        onClick={() => navigate(`/play/${compId}`)}
                        className="text-muted px-2 py-2 rounded-full w-fit font-semibold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors bg-transparent hover:bg-black/40 hover:text-body"
                    >
                        <PlusIcon size={20} weight='bold' />
                        <span>Watch list</span>
                    </button>
                </div>

                <div className={`flex flex-col text-muted transition-opacity duration-300 ${changingPosterType && 'opacity-0 pointer-events-none'}`}>
                    <ExpandableText
                        text={media.overview}
                        className="tracking-wide indent-4"
                        lineClampClass="line-clamp-4"
                        showLessText="show less"
                        showLessClassName="ml-2 text-white/70 hover:text-white text-sm font-normal cursor-pointer transition-colors whitespace-nowrap"
                    />
                </div>

                {/* Poster and logo for editing */}
                <AnimatePresence>
                    {changingPosterType && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className='flex items-end gap-4 absolute top-0 mp:inset-x-0 mp:h-[calc(45dvh-1rem)] ml:h-dvh ml:left-0 ml:right-[calc(40dvw+1rem)] p-4'
                        >
                            <div className={`relative z-10 mp:w-[35vw] ml:h-[55dvh] shrink-0 rounded-lg overflow-hidden shadow-2xl shadow-black/50 origin-bottom-left transition-transform duration-500 ${changingPosterType === 'poster' ? 'scale-105' : 'scale-100'}`}>
                                <MediaImage
                                    relativePath={displayPoster}
                                    altText={media.title}
                                    className='w-full h-full object-cover block'
                                />

                                <RingGlow rounded="rounded-lg" intensity="90" className={`transition-opacity duration-500 opacity-100 ${changingPosterType && 'opacity-100'}`} />
                            </div>

                            {displayLogo ? (
                                <MediaImage
                                    relativePath={displayLogo}
                                    altText={media.title}
                                    className={`w-fit max-w-1/2 max-h-1/2 origin-bottom-left transition-transform duration-500 ${changingPosterType === 'logo' ? 'scale-105' : 'scale-100'}`}
                                />
                            ) : (
                                <h1 className="text-2xl font-bold tracking-wide">
                                    {media.title}
                                </h1>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs and Content below */}
                <div className={`w-full flex flex-col pb-8 transition-opacity duration-300 ${changingPosterType && 'opacity-0 pointer-events-none'}`}>
                    <div className='relative z-50 -mx-4 w-[calc(100%+2rem)] flex justify-stretch items-center text-center border-b border-transparent overflow-hidden bg-black mix-blend-screen'>
                        <TabsButton name={'Details'} isSelected={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                        {media.type === 'show' && (
                            <TabsButton name={'Episodes'} isSelected={activeTab === 'episodes'} onClick={() => setActiveTab('episodes')} />
                        )}
                        <TabsButton name={'Cast'} isSelected={activeTab === 'cast'} onClick={() => setActiveTab('cast')} />
                        <div className="absolute inset-0 pointer-events-none mix-blend-overlay border-b border-white" />
                    </div>

                    {activeTab === 'episodes' && (() => {
                        let allSeasons = [...(media.seasons || [])];
                        if (media.specials && media.specials.episodes && media.specials.episodes.length > 0) {
                            allSeasons.push(media.specials);
                        }
                        const validSeasons = allSeasons.filter(season => season.episodes && season.episodes.length > 0)
                            .sort((a, b) => {
                                if (a.number === 0) return 1;
                                if (b.number === 0) return -1;
                                return a.number - b.number;
                            });
                        if (validSeasons.length === 0) return null;

                        const defaultSeason = validSeasons.find(s => s.isLastWatched) || validSeasons.find(s => s.number !== 0) || validSeasons[0];
                        const currentSeasonNumber = selectedSeasonNumber ?? defaultSeason?.number;
                        const currentSeason = validSeasons.find(s => s.number === currentSeasonNumber) || validSeasons[0];

                        return (
                            <>
                                <div className='flex flex-col text-body noselect mt-4'>
                                    {isStuck && <div className="fixed top-0 inset-x-0 h-20 bg-background z-40 pointer-events-none" />}
                                    <div ref={dropdownRef} className='sticky top-20 z-40 bg-background pb-3 pt-1 -mx-4 px-4 ml:-mx-6 ml:px-6'>
                                        <div className="w-fit">
                                            <Dropdown
                                                usePortal={true}
                                                align="left"
                                                dropdownClassName="-ml-1 min-w-48 max-h-[50vh] overflow-y-auto"
                                                Trigger={SeasonTrigger}
                                                triggerProps={{ currentSeason }}
                                            >
                                                {({ close }) => (
                                                    <div className="flex flex-col gap-1">
                                                        {validSeasons.map(season => (
                                                            <button
                                                                key={season.number}
                                                                onClick={() => { setSelectedSeasonNumber(season.number); close(); }}
                                                                className={`flex items-center justify-between text-left text-lg px-2 py-1 rounded-lg transition-colors ${currentSeasonNumber === season.number ? 'bg-white/10 text-white font-semibold' : 'hover:bg-white/5 text-muted'}`}
                                                            >
                                                                <span>{season.name}</span>
                                                                <span className="text-sm opacity-50 ml-4">{season.episodes.length} Episodes</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </Dropdown>
                                        </div>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`season_episodes_${currentSeason.number}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col gap-3 -mx-3"
                                        >
                                            {currentSeason.episodes.map((episode) => (
                                                <EpisodeCard
                                                    key={`season_${currentSeason.number}_episode_${episode.number}`}
                                                    episode={episode}
                                                    navigate={navigate}
                                                    compId={compId}
                                                    seasonNumber={currentSeason.number}
                                                />
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </>
                        );
                    })()}

                    {activeTab === 'cast' && (
                        <div className='flex  flex-col gap-4 text-body noselect overflow-hidden w-full mt-6'>
                            <div className='flex overflow-x-auto gap-4 pb-4 -mb-4 -mx-4 px-4'>
                                {media?.cast?.map((actor) => (
                                    <div 
                                        key={actor.id} 
                                        onClick={() => navigate(`/details/person_${actor.id}`)}
                                        className="w-28 flex flex-col shrink-0 group snap-start cursor-pointer"
                                    >

                                        <ProfileImage imagePath={actor.profilePath} className="w-full aspect-2/3 rounded-lg" />

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
                compId={compId}
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
                compId={compId}
                navigate={navigate}
            />

            <FileInfoModal
                isOpen={activeModal === 'FILE_INFO'}
                onClose={() => setActiveModal(null)}
                media={media}
            />

            <ChangePostersPanel
                media={media}
                changingPosterType={changingPosterType}
                setChangingPosterType={setChangingPosterType}
                newPosterUrls={newPosterUrls}
                setNewPosterUrls={handleSetNewPosterUrls}
            />
        </div>
    );
}

