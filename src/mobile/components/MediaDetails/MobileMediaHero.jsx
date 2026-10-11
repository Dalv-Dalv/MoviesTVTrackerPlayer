import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon, DotsThreeVerticalIcon, MagnifyingGlassIcon, InfoIcon, ImageSquareIcon, ClockCounterClockwiseIcon, TrashIcon, PlayIcon, PlusIcon } from '@phosphor-icons/react';
import { MediaImage } from '../../../shared/components/MediaImage';
import { Dropdown } from '../../../shared/components/Dropdown';
import { ExpandableText } from '../../../shared/components/ExpandableText';
import { formatRuntime } from '../../../shared/utils/PlayerUtils';
import { getImageUrl } from '../../../shared/services/TMDBMetadata';
import { CustomTrailerPlayer } from '../../../shared/components/CustomTrailerPlayer';

export function TabsButton({ name, onClick, isSelected = false, className = '' }) {
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
    );
}

export function MobileMediaHero({
    media,
    compId,
    navigate,
    changingPosterType,
    setChangingPosterType,
    posterOverrides,
    onOpenModal,
    movieGenres,
    tvGenres,
    historyLoaded,
    history,
    activeTab,
    setActiveTab,
}) {
    const displayBackdrop = posterOverrides && posterOverrides.backdrop !== media?.rawBackdropUrl && changingPosterType
        ? getImageUrl(posterOverrides.backdrop, 'w780')
        : (media?.backdropPathFull || media?.backdropPath);

    const displayLogo = posterOverrides && posterOverrides.logo !== media?.rawLogoUrl && changingPosterType
        ? getImageUrl(posterOverrides.logo)
        : media?.logoPath;

    let playButtonText = 'Play';
    if (historyLoaded && media) {
        if (media.type === 'show' && history?.lastPlayedSeason != null) {
            playButtonText = `Resume S${history.lastPlayedSeason} E${history.lastPlayedEpisode || 1}`;
        } else if (media.type === 'movie' && history?.progress > 0 && !history?.completed) {
            playButtonText = 'Resume';
        }
    }

    const releaseYear = media?.releaseDate?.split('-')[0] || 'Unknown Year';
    const runtimeText = media?.type === 'movie' 
        ? `${formatRuntime(media.runtime)}` 
        : `${media?.seasons?.length || 0} Season${(media?.seasons?.length || 0) > 1 ? 's' : ''}`;

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

    const shouldShowBackdrop = changingPosterType || (!isTrailerReady || !minimumTimePassed) || !media?.trailerKey;

    return (
        <>
            {/* Backdrop & Trailer Container */}
            <div className='relative w-full shrink-0 top-0 ml:max-h-[90dvh] overflow-hidden noselect flex justify-center bg-black'>
                {media?.trailerKey && (
                    <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${shouldShowBackdrop ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
                        <CustomTrailerPlayer
                            trailerKey={media.trailerKey}
                            isPaused={!!changingPosterType}
                            onReadyToPlay={() => setIsTrailerReady(true)}
                        />
                    </div>
                )}

                <MediaImage
                    relativePath={displayBackdrop}
                    className={`w-[120%] max-w-none shrink-0 pointer-events-none transition-all duration-1000 ${changingPosterType === 'backdrop' ? 'scale-101' : 'scale-100'} ${shouldShowBackdrop ? 'opacity-100' : 'opacity-0'}`}
                />

                <div className={`absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,black_100%)] pointer-events-none transition-opacity duration-1000 ${shouldShowBackdrop ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="fixed top-10 left-4 z-60 text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body transition-colors bg-black/10 active:bg-black/0 rounded-full px-3 py-2 noselect backdrop-blur-md"
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
                                const text = dict?.[id] || id;
                                return (
                                    <div key={id} className='flex items-center gap-1 tracking-wide shrink-0 whitespace-nowrap'>
                                        <span>{text}</span>
                                        {index < arr.length - 1 && <span>•</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dropdown Options */}
                    <div className="flex items-center justify-center">
                        <Dropdown
                            usePortal={true}
                            dropdownClassName="min-w-32"
                            Trigger={({ isOpen, toggle }) => (
                                <button
                                    onClick={toggle}
                                    className={`text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body bg-black/10 active:bg-black/0 rounded-full px-3 py-2 noselect transition-all duration-300 ${isOpen ? '-rotate-90 bg-black/50' : 'rotate-0'}`}
                                >
                                    <DotsThreeVerticalIcon size={26} weight="bold" />
                                </button>
                            )}
                        >
                            {({ close }) => (
                                <>
                                    {media?.isDownloaded && (
                                        <>
                                            <button
                                                onClick={() => { onOpenModal('FIX_MATCH'); close(); }}
                                                className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
                                            >
                                                <MagnifyingGlassIcon size={20} weight="bold" />
                                                <span>Fix Match</span>
                                            </button>

                                            <button
                                                onClick={() => { onOpenModal('FILE_INFO'); close(); }}
                                                className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
                                            >
                                                <InfoIcon size={20} weight="bold" />
                                                <span>View Files Info</span>
                                            </button>

                                            <button
                                                onClick={() => { setChangingPosterType("backdrop"); onOpenModal('CHANGE_POSTERS'); close(); }}
                                                className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10'
                                            >
                                                <ImageSquareIcon size={20} weight='bold' />
                                                <span>Change posters</span>
                                            </button>
                                        </>
                                    )}

                                    <button
                                        onClick={() => { onOpenModal('CONFIRM_RESET'); close(); }}
                                        className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300'
                                    >
                                        <ClockCounterClockwiseIcon size={20} weight="bold" />
                                        <span>Reset Watch Time</span>
                                    </button>

                                    {media?.isDownloaded && (
                                        <button
                                            onClick={() => { onOpenModal('CONFIRM_REMOVE'); close(); }}
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
                </div>

                {/* Overview & Action Buttons */}
                <div className={`flex flex-col gap-4 transition-opacity duration-300 ${changingPosterType && 'opacity-0 pointer-events-none'}`}>
                    <ExpandableText
                        text={media.overview}
                        className="text-body text-sm leading-relaxed"
                        lineClampClass="line-clamp-3"
                        showLessText="Show less..."
                    />

                    <div className='flex gap-2 noselect'>
                        {media?.isDownloaded ? (
                            <button
                                onClick={() => navigate(`/play/${compId}`)}
                                className="bg-body text-black px-4 py-2.5 rounded-xl font-bold flex flex-row items-center justify-center gap-2 cursor-pointer flex-1 transition-colors hover:bg-body/90"
                            >
                                <PlayIcon size={20} weight='fill' />
                                <span>{playButtonText}</span>
                            </button>
                        ) : (
                            <div className="ring-inset ring-2 ring-muted text-muted px-4 py-2.5 rounded-xl font-bold flex flex-row items-center justify-center gap-2 flex-1">
                                <PlayIcon size={20} weight='bold' />
                                <span>Unavailable</span>
                            </div>
                        )}

                        <button
                            onClick={() => navigate(`/play/${compId}`)}
                            className="text-muted px-4 py-2.5 rounded-xl font-semibold flex flex-row items-center justify-center gap-2 cursor-pointer bg-white/5 active:bg-white/10 transition-colors"
                        >
                            <PlusIcon size={20} weight='bold' />
                            <span>Watchlist</span>
                        </button>
                    </div>
                </div>

                {/* Logo Override View */}
                <AnimatePresence>
                    {changingPosterType && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex items-center justify-center py-6"
                        >
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

                {/* Tabs Bar */}
                <div className={`w-full flex flex-col pb-2 transition-opacity duration-300 ${changingPosterType && 'opacity-0 pointer-events-none'}`}>
                    <div className='relative z-50 -mx-4 w-[calc(100%+2rem)] flex justify-stretch items-center text-center border-b border-transparent overflow-hidden bg-black mix-blend-screen'>
                        <TabsButton name={'Details'} isSelected={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                        {media.type === 'show' && (
                            <TabsButton name={'Episodes'} isSelected={activeTab === 'episodes'} onClick={() => setActiveTab('episodes')} />
                        )}
                        <TabsButton name={'Cast'} isSelected={activeTab === 'cast'} onClick={() => setActiveTab('cast')} />
                        <div className="absolute inset-0 pointer-events-none mix-blend-overlay border-b border-white" />
                    </div>
                </div>
            </div>
        </>
    );
}

export function MobileMediaHeroSkeleton() {
    return (
        <div className="w-full flex flex-col gap-6 animate-pulse">
            <div className="w-full aspect-video bg-white/10" />
            <div className="px-4 flex flex-col gap-4">
                <div className="w-2/3 h-8 bg-white/10 rounded-md" />
                <div className="w-1/3 h-5 bg-white/10 rounded-md" />
                <div className="w-full h-16 bg-white/5 rounded-md" />
                <div className="w-full h-12 bg-white/10 rounded-xl" />
            </div>
        </div>
    );
}
