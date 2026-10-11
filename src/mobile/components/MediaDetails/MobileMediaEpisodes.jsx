import { useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CaretDownIcon, PlayIcon, CheckCircleIcon, CheckIcon, MagnifyingGlassIcon, ClockCounterClockwiseIcon, TrashIcon, CalendarBlankIcon, ClockCountdownIcon } from '@phosphor-icons/react';
import { Dropdown } from '../../../shared/components/Dropdown';
import { useWatchHistoryStore } from '../../../shared/store/useWatchHistoryStore';
import { useLibraryStore } from '../../../shared/store/useLibraryStore';
import { useLongPress } from '../../../shared/hooks/useLongPress';
import { formatRuntime, formatSeasonName } from '../../../shared/utils/PlayerUtils';
import { open } from '@tauri-apps/plugin-dialog';
import RingGlow from '../../../shared/components/RingGlow';

function SeasonTrigger({ isOpen, toggle, currentSeason, showTitle }) {
    return (
        <div
            onClick={toggle}
            className='text-xl w-fit flex items-center gap-2 noselect cursor-pointer group'
        >
            <h2 className='text-body font-semibold'>
                {formatSeasonName(currentSeason, showTitle)}
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
                {/* Thumbnail */}
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
                            <div className="absolute z-20 inset-0 pointer-events-none">
                                <RingGlow rounded="rounded-full" />
                            </div>
                        </div>
                    )}

                    <div className="absolute inset-0 pointer-events-none">
                        <RingGlow rounded="rounded-xl" />
                    </div>
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
    );
}

function UpcomingSeasonCard({ season, media }) {
    const formattedAirDate = season?.airDate ? new Date(season.airDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : null;

    return (
        <div className="relative grid grid-cols-[auto_1fr] gap-3 gap-y-2 w-full p-2 rounded-2xl">
            {/* Thumbnail */}
            <div className="relative isolate shrink-0 ml:w-48 mp:w-36 aspect-video bg-background rounded-xl overflow-hidden flex items-center justify-center">
                {season.posterPath ? (
                    <img
                        src={season.posterPath}
                        alt={season.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-muted">
                        <ClockCountdownIcon size={28} weight="regular" className="opacity-40" />
                    </div>
                )}
                <RingGlow rounded="rounded-xl" />
            </div>

            {/* Info */}
            <div className="relative z-20 pr-4 flex flex-col flex-1 justify-center gap-1">
                <span className="text-[0.95rem] font-medium">
                    {season.name} (Upcoming)
                </span>

                <p className="text-muted text-sm mp:hidden line-clamp-2">
                    {season.overview || "No episode details or air dates have been announced yet."}
                </p>

                <div className="text-muted text-xs flex items-center gap-1.5 flex-wrap">
                    {formattedAirDate ? (
                        <span>Expected {formattedAirDate}</span>
                    ) : (
                        <span>Release date TBA</span>
                    )}
                    {media?.status && (
                        <>
                            <span>•</span>
                            <span>{media.status}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile small portrait overview */}
            <div className="ml:hidden col-span-2 px-1">
                <p className="text-muted text-sm">
                    {season.overview || "No episode details or air dates have been announced yet for this season."}
                </p>
            </div>
        </div>
    );
}

export function MobileMediaEpisodes({
    media,
    compId,
    selectedSeasonNumber,
    onSelectSeason,
    navigate,
    isSeasonLoading,
    showSeasonSkeleton
}) {
    const dropdownRef = useRef(null);

    const validSeasons = useMemo(() => {
        if (!media || media.type !== 'show') return [];
        let allSeasons = [...(media.seasons || [])];
        if (media.specials && (media.specials.episodeCount > 0 || media.specials.episodes?.length > 0)) {
            allSeasons.push(media.specials);
        }

        // Keep all seasons that exist on TMDB or in local files
        return allSeasons
            .filter(season => (season.episodes && season.episodes.length > 0) || (season.episodeCount && season.episodeCount > 0) || season.number != null)
            .sort((a, b) => {
                if (a.number === 0) return 1;
                if (b.number === 0) return -1;
                return a.number - b.number;
            });
    }, [media]);

    if (validSeasons.length === 0) return null;

    const defaultSeason = validSeasons.find(s => s.isLastWatched) || validSeasons.find(s => s.number !== 0) || validSeasons[0];
    const currentSeasonNumber = selectedSeasonNumber ?? defaultSeason?.number;
    const currentSeason = validSeasons.find(s => s.number === currentSeasonNumber) || validSeasons[0];

    const episodes = currentSeason?.episodes;
    const isLoadingEpisodes = isSeasonLoading || !episodes;
    const isUpcoming = (currentSeason?.episodeCount === 0) || (!isLoadingEpisodes && episodes && episodes.length === 0);

    return (
        <div className='flex flex-col text-body noselect mt-4 px-4 ml:px-6'>
            <div ref={dropdownRef} className='sticky top-20 z-40 bg-background pb-3 pt-1 -mx-4 px-4 ml:-mx-6 ml:px-6'>
                <div className="w-fit">
                    <Dropdown
                        usePortal={true}
                        align="left"
                        dropdownClassName="-ml-1 min-w-48 max-h-[50vh] overflow-y-auto"
                        Trigger={SeasonTrigger}
                        triggerProps={{ currentSeason, showTitle: media?.title }}
                    >
                        {({ close }) => (
                            <div className="flex flex-col gap-1">
                                {validSeasons.map(season => {
                                    const isSeasonUpcoming = (season.episodeCount === 0) || (season.episodes && season.episodes.length === 0 && (!season.episodeCount || season.episodeCount === 0));
                                    const countText = isSeasonUpcoming
                                        ? 'Upcoming'
                                        : `${season.episodes?.length ?? season.episodeCount ?? 0} Episodes`;

                                    return (
                                        <button
                                            key={season.number}
                                            onClick={() => { onSelectSeason(season.number); close(); }}
                                            className={`flex items-center justify-between text-left text-lg px-2 py-1 rounded-lg transition-colors ${currentSeasonNumber === season.number ? 'bg-white/10 text-white font-semibold' : 'hover:bg-white/5 text-muted'}`}
                                        >
                                            <span>{formatSeasonName(season, media?.title)}</span>
                                            <span className={`text-sm ml-4 ${isSeasonUpcoming ? 'text-primary/90 font-medium' : 'opacity-50'}`}>
                                                {countText}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Dropdown>
                </div>
            </div>

            {showSeasonSkeleton && isLoadingEpisodes && !isUpcoming ? (
                <MobileMediaEpisodesSkeleton />
            ) : isUpcoming ? (
                <UpcomingSeasonCard season={currentSeason} media={media} />
            ) : episodes && episodes.length > 0 ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`season_episodes_${currentSeason.number}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-3 -mx-3"
                    >
                        {episodes.map((episode) => (
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
            ) : null}
        </div>
    );
}

export function MobileMediaEpisodesSkeleton() {
    return (
        <div className="flex flex-col gap-3 w-full animate-pulse">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="relative grid grid-cols-[auto_1fr] gap-3 gap-y-2 w-full p-2 rounded-2xl">
                    <div className="shrink-0 ml:w-48 mp:w-36 w-32 aspect-video bg-white/10 rounded-xl" />
                    <div className="flex flex-col justify-center gap-2 pr-10">
                        <div className="w-36 h-4 bg-white/10 rounded" />
                        <div className="w-16 h-3 bg-white/5 rounded" />
                    </div>
                    <div className="ml:hidden col-span-2 px-1 flex flex-col gap-1 mt-1">
                        <div className="w-full h-3 bg-white/5 rounded" />
                        <div className="w-3/4 h-3 bg-white/5 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}
