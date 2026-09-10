import { AnimatePresence, motion } from 'framer-motion';
import { MovieImage } from '../../shared/components/Poster';
import { Modal } from '../../shared/components/Modal';
import { DotsThreeVerticalIcon, PlayIcon, PlusIcon, XIcon, MagnifyingGlassIcon, ClockCounterClockwiseIcon, TrashIcon, CheckIcon, ArrowLeftIcon, CaretDownIcon, CaretRightIcon, ClockCountdownIcon, ClockIcon } from '@phosphor-icons/react';
import { useWatchHistory } from '../../shared/contexts/WatchHistoryContext';
import { useLibraryStore } from '../../shared/store/useLibraryStore';
import { InfoIcon } from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import { FixMatchModal } from './FixMatchModal';
import { RemoveMediaModal } from './RemoveMediaModal';
import { FileInfoModal } from './FileInfoModal';
import { useGenres } from '../../shared/contexts/GenresContext';

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


function SeasonSection({season, className = ''}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`rounded-2xl text-lg ${className}`}>
            <div 
                className='relative px-4 py-2 flex items-center gap-4 rounded-lg cursor-pointer group bg-background' 
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className='absolute inset-px overflow-hidden rounded-full'>
                    <div
                        className={`absolute left-[-45%] h-[200%] w-full bg-[radial-gradient(circle_1040px_at_50%_630px,white_50%,transparent_60%)] opacity-15 group-hover:opacity-20 group-active:opacity-30 transition-[opacity,translate] group-hover:-translate-y-2 duration-300 pointer-events-none
                        ${isExpanded ? 'opacity-35 group-hover:opacity-40 -translate-y-2 group-hover:-translate-y-2.5' : 'translate-y-6'}`}
                    />

                    <div className="absolute z-10 inset-0 pointer-events-none mix-blend-overlay rounded-full border border-white" />
                </div>

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
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-4">
                            <div className="flex flex-col gap-4">
                                {season.episodes.map((episode, index) => (
                                    <EpisodeCard key={`season_${season.number}_episode_${episode.number}`} episode={episode}/>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function EpisodeCard({ episode, className = '' }) {
    return (
        <div className={`relative flex items-center gap-4 overflow-hidden bg-background group cursor-pointer ${className}`}>
            <div className='relative z-20'>
                <div className='relative h-35'>
                    <img src={episode.stillPath} className='h-full rounded-2xl'/>

                    <div className='absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                        <div className="bg-black/60 rounded-full p-4 text-body">
                            <PlayIcon size={24} weight="fill" />
                        </div>
                    </div>
                </div>
                
                <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
            </div>

            <img src={episode.stillPath} className='absolute w-full h-35 blur-xl rounded-2xl mask-[linear-gradient(to_right,black_0%,transparent_100%)] opacity-0 group-hover:opacity-80 transition-opacity duration-300'/>
            <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />

            <div className='relative z-20 flex flex-col flex-1 justify-center gap-1'>
                <span>
                    {episode.name || `Episode ${episode.episodeNumber}`}
                </span>

                <p className='text-muted text-sm'>
                    {episode.overview}
                </p>

                <span className='text-muted text-sm'>
                    {episode.runtime}m
                </span>
            </div>
        </div>
    )
}


export function DesktopMediaDetails({ media, tmdbId, navigate }) {
    const { history, setProgressAndSave, isLoaded: historyLoaded } = useWatchHistory(tmdbId);
    const { movieGenres, tvGenres } = useGenres();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const settingsRef = useRef(null);
    const [activeTab, setAcitveTab] = useState('details');
    const [trailerPlaying, setTrailerPlaying] = useState(false);

    useEffect(() => {
        setTrailerPlaying(false);
    }, [media.trailerKey]);

    useEffect(() => {
        if (!settingsOpen) return;

        const handleClickOutside = (event) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setSettingsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [settingsOpen]);

    console.log(media);

    return (
        <div className="w-full pb-400">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.5 }}
                className='absolute left-0 top-0 w-full pointer-events-none noselect'
            >
                <MovieImage
                    relativePath={media.backdropPath}
                    className='mask-[linear-gradient(to_top,transparent_1%,black_60%)] pointer-events-none'
                />
            </motion.div>

            {/* Back button */}
            <div ref={settingsRef} className='fixed top-6 inset-x-6 z-50 flex items-center justify-between gap-2 pointer-events-none'>
                <button
                    onClick={() => navigate(-1)}
                    className="text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body transition-colors bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-full px-3 py-2 noselect pointer-events-auto"
                >
                    <ArrowLeftIcon size={25} weight='bold' />
                </button>

                <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-4xl px-3 py-2 noselect pointer-events-auto
                            transition-all duration-300 ${settingsOpen ? '-rotate-90 bg-black/50 rounded-l-2xl hover:bg-black/60' : 'rotate-0'}`}
                >
                    <DotsThreeVerticalIcon size={26} weight="bold" />
                </button>

                {/* Properties panel */}
                <AnimatePresence>
                    {settingsOpen && (
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{
                                type: "tween",
                                ease: [0.5, 0, 0, 1],
                                duration: 0.3
                            }}
                            className='top-[110%] right-0 z-40 absolute bg-black/50 text-body flex flex-col items-stretch p-2 rounded-2xl backdrop-blur-sm pointer-events-auto'
                        >
                            <button
                                onClick={() => { setActiveModal('FIX_MATCH'); setSettingsOpen(false); }}
                                className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 shadow-none hover:shadow-md shadow-black/20 hover:bg-white/3'
                            >
                                <MagnifyingGlassIcon size={20} weight="bold" />
                                <span>Fix Match</span>
                            </button>

                            <button
                                onClick={() => { setActiveModal('FILE_INFO'); setSettingsOpen(false); }}
                                className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 rounded-lg transition-all duration-300 shadow-none hover:shadow-md shadow-black/20 hover:bg-white/3'
                            >
                                <InfoIcon size={20} weight="bold" />
                                <span>View Files Info</span>
                            </button>

                            <button
                                onClick={() => { setActiveModal('CONFIRM_RESET'); setSettingsOpen(false); }}
                                className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300 shadow-none hover:shadow-md shadow-black/20'
                            >
                                <ClockCounterClockwiseIcon size={20} weight="bold" />
                                <span>Reset Watch Time</span>
                            </button>

                            <button
                                onClick={() => { setActiveModal('CONFIRM_REMOVE'); setSettingsOpen(false); }}
                                className='flex gap-2 items-center text-nowrap tracking-wide px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300 shadow-none hover:shadow-md shadow-black/20'
                            >
                                <TrashIcon size={20} weight="bold" />
                                <span>Remove from Library</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Main details */}
            <div className='w-full relative grid grid-cols-[min(33vw,20rem)_minmax(0,1fr)] gap-12'>
                {/* Poster column */}
                <div
                    className='w-full h-full relative pl-12 pt-[calc(100vh+1.5rem-min(33vw,20rem)*1.5)] noselect'
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{
                            opacity: 0,
                            scale: 1,
                            transition: { duration: 0.15, ease: "easeIn" }
                        }}
                        transition={{
                            type: "tween",
                            ease: [0.5, 0, 0, 1],
                            duration: 0.7
                        }}
                        className="w-full max-w-80 z-10 sticky top-12"
                    >
                        <MovieImage
                            relativePath={media.posterPath}
                            altText={media.title}
                            className='absolute w-full blur-2xl opacity-50'
                        />

                        <div className="relative z-10 w-full aspect-2/3 rounded-lg overflow-hidden shadow-2xl shadow-black/50">
                            <MovieImage
                                relativePath={media.posterPath}
                                altText={media.title}
                                className='w-full h-full object-cover block'
                            />

                            <div className="absolute rounded-lg inset-0 ring-2 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                            <div className="absolute rounded-lg inset-0 ring-2 ring-inset ring-white/8 pointer-events-none" />
                        </div>
                    </motion.div>
                </div>


                {/* Right details column */}
                <div className='w-full h-full min-w-0'>
                    <div className='flex flex-col h-screen justify-end p-12 pl-0 text-body relative z-10'>
                        <h1 className="text-4xl font-bold tracking-wide">
                            {media.title}
                        </h1>

                        <div className='flex items-center gap-2 noselect mt-4 pb-6 text-muted w-full overflow-x-auto '>
                            {(media.genreIds || media.genres || []).map(id => {
                                const dict = media.type === 'show' ? tvGenres : movieGenres;
                                const text = dict[id] || id;
                                return (
                                    <div key={id} className='bg-white/6 rounded-full p-2 px-4 tracking-wide border border-white/8 backdrop-blur-sm shrink-0 whitespace-nowrap'>
                                        {text}
                                    </div>
                                )
                            })}
                        </div>



                        <div className='flex gap-4 noselect'>
                            <button
                                onClick={() => navigate(`/play/${tmdbId}`)}
                                className="bg-body text-black px-6 py-3 rounded-full w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:bg-body/90"
                            >
                                <PlayIcon size={20} weight='fill' />
                                <span>
                                    {historyLoaded && history?.progress > 10 ? 'Resume' : 'Play'}
                                </span>
                            </button>

                            <button
                                onClick={() => navigate(`/play/${tmdbId}`)}
                                className="text-muted px-4 py-3 rounded-full w-fit font-semibold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors bg-transparent hover:bg-black/40 hover:text-body"
                            >
                                <PlusIcon size={20} weight='bold' />
                                <span>Add to watch list</span>
                            </button>
                        </div>
                    </div>

                    <div className='relative w-full max-w-2/3 flex justify-stretch items-center mb-4 text-center rounded-full border border-transparent overflow-hidden bg-black mix-blend-screen'>
                        <TabsButton name={'Details'} isSelected={activeTab === 'details'} onClick={() => setAcitveTab('details')} />

                        {media.type === 'show' && (
                            <TabsButton name={'Episodes'} isSelected={activeTab === 'episodes'} onClick={() => setAcitveTab('episodes')} />
                        )}

                        <TabsButton name={'Cast'} isSelected={activeTab === 'cast'} onClick={() => setAcitveTab('cast')} />

                        <div className="absolute inset-0 pointer-events-none mix-blend-overlay rounded-full border border-x-2 border-white" />
                    </div>

                    {activeTab === 'details' && (
                        <p className="text-xl text-body max-w-2/3 text-justify">
                            {media.overview}
                        </p>
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
                                        className='absolute inset-0 blur-lg rounded-2xl -z-10'
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
                                <SeasonSection key={`season_${season.number}`} season={season}/>
                            ))}
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
    );
}
