import { AnimatePresence, motion } from 'framer-motion';
import { MovieImage } from '../../shared/components/MovieImage';
import { Modal } from '../../shared/components/Modal';
import { DotsThreeVerticalIcon, PlayIcon, PlusIcon, XIcon, MagnifyingGlassIcon, ClockCounterClockwiseIcon, TrashIcon, CheckIcon, ArrowLeftIcon, CaretDownIcon, CaretRightIcon, ClockCountdownIcon, ClockIcon, ImageSquareIcon, EyeIcon, UserIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { useWatchHistoryStore, getResumeEpisode } from '../../shared/store/useWatchHistoryStore';
import { useLibraryStore } from '../../shared/store/useLibraryStore';
import { InfoIcon } from '@phosphor-icons/react';
import { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { MediaDetailsContext } from '../../shared/components/MediaDetails';
import { formatRuntime } from '../../shared/utils/PlayerUtils';
import { FixMatchModal } from '../../shared/components/FixMatchModal';
import { RemoveMediaModal } from '../../shared/components/RemoveMediaModal';
import { FileInfoModal } from '../../shared/components/FileInfoModal';
import { useGenres } from '../../shared/contexts/GenresContext';
import { Dropdown } from '../../shared/components/Dropdown';
import { open } from '@tauri-apps/plugin-dialog';
import { ChangePostersPanel } from '../../shared/components/ChangePostersPanel';
import { getImageUrl } from '../../shared/services/TMDBMetadata';

import { TabsButton } from '../../shared/components/TabsButton';

function SeasonSection({ season, navigate, tmdbId, className = '' }) {
    const [isExpanded, setIsExpanded] = useState(season.isLastWatched);
    const [isAnimating, setIsAnimating] = useState(false);
    const headerRef = useRef(null);

    const toggleExpanded = () => {
        if (isExpanded && headerRef.current) {
            const header = headerRef.current;
            const parent = header.parentElement;
            const scrollContainer = header.closest('.overflow-y-auto');

            if (scrollContainer) {
                const parentRect = parent.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();
                const relativeTop = parentRect.top - containerRect.top;

                if (relativeTop < 40) {
                    const absoluteTop = scrollContainer.scrollTop + relativeTop;
                    const targetScrollTop = absoluteTop - 40;

                    setTimeout(() => {
                        scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'auto' });
                    }, 0);
                }
            } else {
                const parentRect = parent.getBoundingClientRect();
                if (parentRect.top < 40) {
                    const absoluteTop = window.scrollY + parentRect.top;
                    const targetScrollTop = absoluteTop - 40;

                    setTimeout(() => {
                        window.scrollTo({ top: targetScrollTop, behavior: 'auto' });
                    }, 0);
                }
            }
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`rounded-2xl text-lg ${className}`}>
            <div
                ref={headerRef}
                className='sticky top-10 z-50 px-4 py-2 flex items-center gap-2 cursor-pointer group bg-background'
                onClick={toggleExpanded}
            >
                <CaretRightIcon
                    size={20}
                    weight='bold'
                    className={`text-muted transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                />
                <span className='text-muted text-lg tracking-wide transition-colors group-hover:text-body'>
                    {season.name}
                </span>
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
                        <div className="px-4 py-4">
                            <div className="flex flex-col gap-4">
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
        <div className={`relative flex items-center gap-4 bg-background rounded-2xl group ${className}`}>
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none bg-background">
                <img src={episode.stillPath} className='absolute w-full h-35 blur-xl rounded-2xl mask-[linear-gradient(to_right,black_0%,transparent_100%)] opacity-0 group-hover:opacity-80 transition-opacity duration-300' />
                <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/70 mix-blend-soft-light" />
            </div>

            <div className='relative z-20'>
                {/* Thubmnail */}
                <div
                    className={`relative h-35 rounded-2xl overflow-hidden shadow-lg shadow-background ${episode.isDownloaded ? 'cursor-pointer' : ''}`}
                    onClick={episode.isDownloaded ? (() => navigate(`/play/${tmdbId}?s=${seasonNumber}&e=${episode.number}`)) : (() => { })}
                >
                    <img src={episode.stillPathFull} className='h-full rounded-2xl' />

                    {episode.isDownloaded && (
                        <div className='absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                            <div className="bg-black/60 rounded-full p-4 text-body">
                                <PlayIcon size={24} weight="fill" />
                            </div>
                        </div>
                    )}

                    {watchProgressRatio > 0 && (
                        <div className='absolute bottom-0 inset-x-0 h-1 rounded-full mb-2 mx-3 overflow-hidden'>
                            <div className="absolute rounded-full inset-0 bg-white/30 group-hover:bg-white/70 transition-colors duration-300 pointer-events-none mix-blend-soft-light backdrop-blur-sm" />
                            <div className='relative z-10 h-full rounded-full bg-primary' style={{ width: `${watchProgressRatio * 100}%` }} />
                            <div className="absolute z-20 rounded-full inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                        </div>
                    )}

                    <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                </div>
            </div>

            <div className='relative z-20 flex flex-col flex-1 justify-center gap-1'>
                <div className='flex items-center justify-start gap-2'>
                    <span>
                        {episode.name && `${episode.number}. `}
                        {episode.name || `Episode ${episode.number}`}
                    </span>

                    {episode.isDownloaded && (
                        <div className='pointer-events-none text-muted'>
                            <CheckCircleIcon size={20} weight='fill' />
                        </div>
                    )}
                </div>
                <p className='text-muted text-sm'>
                    {episode.overview}
                </p>

                <span className='text-muted text-sm'>
                    {episode.runtime}m
                </span>
            </div>

            <div className='absolute top-4 right-4 z-30'>
                <Dropdown
                    usePortal={true}
                    dropdownClassName="min-w-32"
                    Trigger={({ isOpen, toggle }) => (
                        <div
                            className={`text-body aspect-square cursor-pointer transition-opacity flex items-center justify-center p-2 rounded-full ${isOpen ? 'opacity-100 bg-white/10' : 'opacity-0 group-hover:opacity-100 hover:bg-white/10'}`}
                            onClick={toggle}
                        >
                            <DotsThreeVerticalIcon size={24} weight='bold' />
                        </div>
                    )}
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
            </div>
        </div>
    )
}


export function DesktopMediaDetails() {
    const {
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
        setTrailerPlaying
    } = useContext(MediaDetailsContext);


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
    const runtimeText = media?.type === 'movie' ? `${formatRuntime(media.runtime)}` : `${media.seasons.length} Seasons`;



    if (!media) return null;

    return (
        <div className="w-full pb-400">
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
                setNewPosterUrls={setNewPosterUrls}
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
                        <div className={`w-full h-full flex flex-col gap-4 justify-end transition-opacity duration-300 ${changingPosterType ? 'opacity-0' : 'opacity-100'}`}>
                            <div className='-mb-1.5'>
                                <h1 className='text-4xl font-bold tracking-wide'>
                                    {media.title}
                                </h1>

                                <div className='text-muted font-semibold flex gap-4'>
                                    <span>{releaseYear}</span>
                                    <span>{runtimeText}</span>
                                </div>
                            </div>


                            <div className='flex items-center gap-2 noselect text-body/80 w-full overflow-x-auto '>
                                {(media.genreIds || media.genres || []).map(id => {
                                    const dict = media.type === 'show' ? tvGenres : movieGenres;
                                    const text = dict[id] || id;
                                    return (
                                        <div key={id} className='bg-white/6 rounded-lg p-2 px-4 tracking-wide border border-white/8 backdrop-blur-sm shrink-0 whitespace-nowrap'>
                                            {text}
                                        </div>
                                    )
                                })}
                            </div>



                            <div className='flex gap-4 noselect'>
                                <button
                                    onClick={() => navigate(`/play/${tmdbId}`)}
                                    className="bg-body text-black px-4 py-3 rounded-lg w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:bg-body/90"
                                >
                                    <PlayIcon size={20} weight='fill' />
                                    <span>
                                        {playButtonText}
                                    </span>
                                </button>

                                <button
                                    onClick={() => navigate(`/play/${tmdbId}`)}
                                    className="text-muted px-4 py-3 rounded-lg w-fit font-semibold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:text-body"
                                >
                                    <PlusIcon size={20} weight='bold' />
                                    <span>Add to watch list</span>
                                </button>
                            </div>
                        </div>

                        <div className={`absolute inset-0 bottom-12 flex flex-col justify-end transition-opacity duration-300 ${!changingPosterType ? 'opacity-0' : 'opacity-100'} origin-bottom-left transition-transform duration-500 ${changingPosterType === 'logo' ? 'scale-105' : 'scale-100'}`}>

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

                    <div className={`transition-all duration-300 ${changingPosterType ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
                        <div className='relative w-full max-w-2/3 flex justify-stretch items-center mb-4 text-center rounded-full border border-transparent overflow-hidden bg-black mix-blend-screen'>
                            <TabsButton name={'Details'} isSelected={activeTab === 'details'} onClick={() => setActiveTab('details')} />

                            {media.type === 'show' && (
                                <TabsButton name={'Episodes'} isSelected={activeTab === 'episodes'} onClick={() => setActiveTab('episodes')} />
                            )}

                            <TabsButton name={'Cast'} isSelected={activeTab === 'cast'} onClick={() => setActiveTab('cast')} />

                            <div className="absolute inset-0 pointer-events-none mix-blend-overlay rounded-full border border-x-2 border-white" />
                        </div>

                        {/* Gap cover mask for sticky seasons */}
                        {activeTab === 'episodes' && (
                            <div className="sticky top-0 h-10 w-full z-40 bg-background pointer-events-none" style={{ marginBottom: '-40px' }} />
                        )}

                        {activeTab === 'details' && (
                            <>
                                <div className="flex flex-col mb-4 text-muted">
                                    <span className='text-body font-semibold'>
                                        Overview
                                    </span>
                                    <p ref={overviewRef} className={`max-w-2/3 text-justify indent-4 ${!isOverviewExpanded ? 'line-clamp-2' : ''}`}>
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
                            </>
                        )}

                        {activeTab === 'details' && media.trailerKey && (
                            <div className="w-full max-w-2/3 aspect-video mt-8 relative z-50 pointer-events-auto group">
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
                        )}

                        {activeTab === 'episodes' && (
                            <div className='flex flex-col gap-2 text-body pr-12 noselect'>
                                {media.seasons && media.seasons.filter(season => season.episodes && season.episodes.length > 0).map((season) => (
                                    <SeasonSection key={`season_${season.number}`} season={season} navigate={navigate} tmdbId={tmdbId} />
                                ))}
                            </div>
                        )}

                        {activeTab === 'cast' && (
                            <div className='flex flex-wrap gap-4 text-body noselect max-w-3/4'>
                                {media?.cast?.map((actor) => (
                                    <div key={actor.id} className="w-32 md:w-40 flex flex-col shrink-0 group">

                                        <div className="w-full aspect-2/3 relative rounded-lg overflow-hidden bg-background">
                                            {actor.profilePath ? (
                                                <MovieImage imagePath={actor.profilePath} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <UserIcon size={100} weight="fill" className="text-white/20" />
                                                </div>
                                            )}

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
                                ))}
                            </div>
                        )}
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
