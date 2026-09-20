import { AnimatePresence, motion } from 'framer-motion';
import { MovieImage } from '../../shared/components/MovieImage';
import { Modal } from '../../shared/components/Modal';
import { DotsThreeVerticalIcon, PlayIcon, PlusIcon, XIcon, MagnifyingGlassIcon, ClockCounterClockwiseIcon, TrashIcon, CheckIcon, ArrowLeftIcon, CaretDownIcon, CaretRightIcon, ClockCountdownIcon, ClockIcon, ImageSquareIcon, EyeIcon, UserIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { useWatchHistoryStore, getResumeEpisode } from '../../shared/store/useWatchHistoryStore';
import { useLibraryStore } from '../../shared/store/useLibraryStore';
import { InfoIcon } from '@phosphor-icons/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useMediaData } from '../../shared/hooks/useMediaData';
import { ExpandableText } from '../../shared/components/ExpandableText';
import { formatRuntime } from '../../shared/utils/PlayerUtils';
import { FixMatchModal } from '../../shared/components/FixMatchModal';
import { RemoveMediaModal } from '../../shared/components/RemoveMediaModal';
import { FileInfoModal } from '../../shared/components/FileInfoModal';
import { useGenres } from '../../shared/contexts/GenresContext';
import { Dropdown } from '../../shared/components/Dropdown';
import { open } from '@tauri-apps/plugin-dialog';
import { ChangePostersPanel } from '../../shared/components/ChangePostersPanel';
import { getImageUrl } from '../../shared/services/TMDBMetadata';
import { Carousel } from '../../shared/components/Carousel';
import { useLongPress } from '../../shared/hooks/useLongPress';


function SeasonTrigger({ isOpen, toggle, currentSeason }) {
    return (
        <div
            onClick={toggle}
            className='text-2xl w-fit flex items-center gap-2 noselect cursor-pointer group'
        >
            <h2 className='text-body font-semibold'>
                {currentSeason.name}
            </h2>
            <CaretDownIcon className={`inline text-muted transition-all duration-300 group-hover:text-body ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
        </div>
    );
}

function EpisodeTrigger({ isOpen, toggle, episode, tmdbId, seasonNumber, navigate, watchProgressRatio, imgLoaded, setImgLoaded }) {
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
            className={`group/card relative flex items-center gap-4 w-full p-2 pr-6 rounded-2xl transition-colors duration-300 cursor-pointer ${isOpen ? 'bg-white/10' : 'hover:bg-white/5 active:bg-white/10'}`}
            style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
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
                <div className={`relative shrink-0 w-64 aspect-video bg-background rounded-xl overflow-hidden cursor-pointer`}>
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
                                className="absolute z-20 rounded-full inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light"
                            />
                        </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300'>
                        <div className='p-3 rounded-full bg-black/40 backdrop-blur-sm text-white/90'>
                            <PlayIcon size={32} weight='fill' />
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }} transition={{ delay: 0.2, duration: 0.2 }}
                        className="absolute rounded-xl inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light"
                    />
                </div>
            </div>

            <div className='relative z-20 pr-12 flex flex-col flex-1 justify-center gap-1.5 pointer-events-none'>
                <span className='font-semibold text-[1.05rem]'>
                    {episode.name && `${episode.number}. `}
                    {episode.name || `Episode ${episode.number}`}
                </span>
                <p className='text-muted text-sm line-clamp-3 leading-relaxed'>
                    {episode.overview}
                </p>
                <span className='text-muted text-sm mt-0.5'>
                    {episode.runtime}m
                </span>
            </div>

            {episode.isDownloaded && (
                <div className='absolute top-1/2 -translate-y-1/2 right-4 z-30 pointer-events-none flex items-center justify-center p-2 text-muted'>
                    <CheckCircleIcon size={24} weight='fill' />
                </div>
            )}
        </div>
    );
}

function EpisodeCard({ episode, tmdbId, seasonNumber, navigate }) {
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
            Trigger={EpisodeTrigger}
            triggerProps={{ episode, tmdbId, seasonNumber, navigate, watchProgressRatio, imgLoaded, setImgLoaded }}
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


export function DesktopMediaDetails({ tmdbId }) {
    const {
        media,
        navigate,
        history,
        historyLoaded,
        setProgressAndSave,
        movieGenres,
        tvGenres
    } = useMediaData(tmdbId);

    const [activeModal, setActiveModal] = useState(null);
    const [changingPosterType, setChangingPosterType] = useState(null);

    const [posterOverrides, setPosterOverrides] = useState(null);
    const [trailerPlaying, setTrailerPlaying] = useState(false);
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(null);

    const [prevId, setPrevId] = useState(tmdbId);
    if (tmdbId !== prevId) {
        setPrevId(tmdbId);
        setPosterOverrides(null);
        setTrailerPlaying(false);
        setSelectedSeasonNumber(null);
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

    const displayPoster = posterOverrides && posterOverrides.poster !== media?.rawPosterUrl && changingPosterType
        ? getImageUrl(posterOverrides.poster, "w342")
        : media?.posterPath;

    const displayBackdrop = posterOverrides && posterOverrides.backdrop !== media?.rawBackdropUrl && changingPosterType
        ? getImageUrl(posterOverrides.backdrop, 'original')
        : (media?.backdropPathFull || media?.backdropPath);

    const displayLogo = posterOverrides && posterOverrides.logo !== media?.rawLogoUrl && changingPosterType
        ? getImageUrl(posterOverrides.logo)
        : media?.logoPath;

    // Various text stuffs
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

    console.log(media);

    if (!media) return (
        <div className="flex flex-col items-center justify-center h-screen w-full text-white">
            <h2 className="text-2xl font-bold mb-4">Movie not found!</h2>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-semibold">Go Back</button>
        </div>
    );

    return (
        <div ref={containerRef} className="w-full pb-400">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.5 }}
                className='absolute left-0 top-0 right-0 max-h-screen overflow-hidden pointer-events-none noselect'
            >
                <MovieImage
                    relativePath={displayBackdrop}
                    className={`w-full pointer-events-none transition-transform duration-500 ${changingPosterType === 'backdrop' ? 'scale-101' : 'scale-100'}`}
                />

                <div className="absolute inset-0 bg-linear-to-t from-black from-1% to-transparent to-60% pointer-events-none" />
            </motion.div>

            <div className='absolute inset-0 top-[100vh] bg-background' />

            {/* Top buttons */}
            <div className='fixed top-6 inset-x-6 z-50 flex items-center justify-between gap-2 pointer-events-none'>
                <button
                    onClick={() => navigate(-1)}
                    className="text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body transition-colors bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-full px-3 py-2 noselect pointer-events-auto"
                >
                    <ArrowLeftIcon size={25} weight='bold' />
                </button>

                <Dropdown
                    usePortal={true}
                    dropdownClassName="min-w-32"
                    Trigger={({ isOpen, toggle }) => (
                        <button
                            onClick={toggle}
                            className={`text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-4xl px-3 py-2 noselect pointer-events-auto
                                    transition-all duration-300 ${isOpen ? '-rotate-90 bg-black/50 rounded-l-2xl hover:bg-black/60' : 'rotate-0'}
                                    ${changingPosterType && 'opacity-0 pointer-events-none'}`}
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

                            {media?.isDownloaded && (
                                <button
                                    onClick={() => { setChangingPosterType("backdrop"); setActiveModal('CHANGE_POSTERS'); close(); }}
                                    className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
                                >
                                    <ImageSquareIcon size={20} weight='bold' />
                                    <span>Change posters</span>
                                </button>
                            )}

                            <button
                                onClick={() => { setActiveModal('CONFIRM_RESET'); close(); }}
                                className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300'
                            >
                                <ClockCounterClockwiseIcon size={20} weight="bold" />
                                <span>Reset Watch Time</span>
                            </button>

                            {media?.isDownloaded && (
                                <button
                                    onClick={() => { setActiveModal('CONFIRM_REMOVE'); close(); }}
                                    className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300'
                                >
                                    <TrashIcon size={20} weight="bold" />
                                    <span>Remove from Library</span>
                                </button>
                            )}
                        </>
                    )}
                </Dropdown>
            </div>

            {/* Edit posters panel */}
            <ChangePostersPanel
                media={media}
                changingPosterType={changingPosterType}
                setChangingPosterType={setChangingPosterType}
                newPosterUrls={newPosterUrls}
                setNewPosterUrls={handleSetNewPosterUrls}
            />

            {/* Main details */}
            <div className='w-full relative grid grid-cols-[min(33vw,20rem)_minmax(0,1fr)] gap-12'>
                {/* Poster column */}
                <div
                    className='w-full h-full relative pl-12 pt-[calc(100vh+1.5rem-min(33vw,20rem)*1.5)] noselect'
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                            opacity: 0, y: 0,
                            transition: { duration: 0.4, ease: "easeIn" }
                        }}
                        transition={{
                            type: "tween",
                            ease: [0.5, 0, 0, 1],
                            duration: 0.7
                        }}
                        className="w-full max-w-80 z-10 sticky top-22"
                    >
                        <MovieImage
                            relativePath={displayPoster}
                            altText={media.title}
                            className={`absolute w-full blur-2xl opacity-50 origin-bottom-left transition-transform duration-500 ${changingPosterType === 'poster' ? 'scale-105' : 'scale-100'}`}
                        />

                        <div className={`relative z-10 w-full aspect-2/3 rounded-lg overflow-hidden shadow-2xl shadow-black/50 origin-bottom-left transition-transform duration-500 ${changingPosterType === 'poster' ? 'scale-105' : 'scale-100'}`}>
                            <MovieImage
                                relativePath={displayPoster}
                                altText={media.title}
                                className='w-full h-full object-cover block'
                            />

                            <div className="absolute rounded-lg inset-0 ring-1 ring-inset ring-white/90 pointer-events-none mix-blend-soft-light" />
                        </div>
                    </motion.div>
                </div>


                {/* Right details column */}
                <div className='w-full h-full min-w-0'>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{
                            opacity: 0, x: 0,
                            transition: { duration: 0.4, ease: "easeIn" }
                        }}
                        transition={{
                            type: "tween",
                            ease: [0.5, 0, 0, 1],
                            duration: 0.7
                        }}
                        className='h-screen p-12 pl-0 text-body relative z-10'
                    >
                        <div className={`w-full h-full flex flex-col gap-2 justify-end transition-opacity duration-300 ${changingPosterType ? 'opacity-0' : 'opacity-100'}`}>
                            <h1 className='text-4xl font-bold tracking-wide text-shadow-lg'>
                                {media.title}
                            </h1>

                            <div className='text-muted tracking-wide font-semibold text-shadow-sm flex gap-4'>
                                <span className='shrink-0'>
                                    {releaseYear}
                                </span>
                                <span className='shrink-0'>
                                    {runtimeText}
                                </span>

                                <div className='flex items-center gap-1 noselect text-muted w-full'>
                                    {(media.genreIds || media.genres || []).map((id, index, arr) => {
                                        const dict = media.type === 'show' ? tvGenres : movieGenres;
                                        const text = dict[id] || id;
                                        return (
                                            <div key={id} className='flex items-center gap-1 tracking-wide shrink-0 whitespace-nowrap'>
                                                <span>{text}</span>
                                                {index < arr.length - 1 && <span>•</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="flex flex-col mb-2 text-body z-20 relative">
                                <ExpandableText
                                    text={media.overview}
                                    className="max-w-4/5 tracking-wide"
                                    lineClampClass="line-clamp-3"
                                    showLessText="Show less..."
                                />
                            </div>

                            <div className='flex gap-2 noselect'>
                                <button
                                    onClick={() => navigate(`/play/${tmdbId}`)}
                                    className="bg-body text-black px-3 py-2 rounded-lg w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:bg-body/90"
                                >
                                    <PlayIcon size={20} weight='fill' />
                                    <span>
                                        {playButtonText}
                                    </span>
                                </button>

                                <button
                                    onClick={() => navigate(`/play/${tmdbId}`)}
                                    className="text-muted px-3 py-2 rounded-lg w-fit font-semibold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:text-body"
                                >
                                    <PlusIcon size={20} weight='bold' />
                                    <span>Add to watch list</span>
                                </button>
                            </div>
                        </div>

                        <div className={`absolute inset-0 bottom-12 flex flex-col justify-end pointer-events-none transition-opacity duration-300 ${!changingPosterType ? 'opacity-0' : 'opacity-100'} origin-bottom-left transition-transform duration-500 ${changingPosterType === 'logo' ? 'scale-105' : 'scale-100'}`}>

                            {displayLogo ? (
                                <MovieImage
                                    relativePath={displayLogo}
                                    altText={media.title}
                                    className='w-fit max-w-1/2 max-h-1/2'
                                />
                            ) : (
                                <h1 className='text-4xl font-bold tracking-wide'>
                                    {media.title}
                                </h1>
                            )}
                        </div>
                    </motion.div>

                    <div className={`flex flex-col gap-12 transition-all duration-300 ${changingPosterType ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
                        {media.cast && media.cast.length > 0 && (
                            <div className='flex flex-col gap-4 w-4/5'>
                                <div className='text-2xl w-fit flex items-center gap-1 noselect cursor-pointer group'>
                                    <h2 className='text-body'>
                                        Credits & Cast
                                    </h2>

                                    <CaretRightIcon className='inline text-muted transition-colors duration-300 group-hover:text-body' />
                                </div>

                                <Carousel id={`cast-${tmdbId}`} paddingClass="px-0 scroll-px-0">
                                    {media?.cast?.map((actor) => (
                                        (actor.profilePath && (
                                            <div key={actor.id} className="w-32 md:w-40 flex flex-col shrink-0 group">
                                                <div className="w-full aspect-2/3 relative rounded-lg overflow-hidden bg-background">
                                                    <MovieImage imagePath={actor.profilePath} className="w-full h-full object-cover" />

                                                    <div className="absolute rounded-lg inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                                                </div>

                                                <div className="flex flex-col mt-1.5 px-1">
                                                    <span className="font-medium text-white truncate" title={actor.name}>
                                                        {actor.name}
                                                    </span>
                                                    <span className="text-sm text-gray-400 truncate" title={actor.character}>
                                                        {actor.character}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ))}
                                </Carousel>
                            </div>
                        )}

                        {media.trailerKey && (
                            <div className="w-full flex flex-col gap-4 relative z-50 pointer-events-auto">
                                <div className='text-2xl w-fit flex items-center gap-1 noselect cursor-pointer group'>
                                    <h2 className='text-body'>
                                        Trailers & Media
                                    </h2>

                                    <CaretRightIcon className='inline text-muted transition-colors duration-300 group-hover:text-body' />
                                </div>

                                <div className='w-1/2 aspect-video'>
                                    {!trailerPlaying ? (
                                        <div
                                            className="w-full h-full relative cursor-pointer group"
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

                                            <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                                                <div className="bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-sm rounded-full p-4 text-body transition-opacity duration-300">
                                                    <PlayIcon size={48} weight="fill" />
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
                            </div>
                        )}

                        {media.type === 'show' && (() => {
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
                                <div className='flex flex-col text-body pr-12 noselect'>
                                    <div className='sticky top-0 z-40 bg-background pt-12 pb-4 -mt-12 w-full'>
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
                                                                <span className="text-sm opacity-50">{season.episodes.length} Episodes</span>
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
                                            className="flex flex-col gap-4"
                                        >
                                            {currentSeason.episodes.map((episode) => (
                                                <EpisodeCard
                                                    key={`season_${currentSeason.number}_episode_${episode.number}`}
                                                    episode={episode}
                                                    navigate={navigate}
                                                    tmdbId={tmdbId}
                                                    seasonNumber={currentSeason.number}
                                                />
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            );
                        })()}
                    </div>
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
    );
}
