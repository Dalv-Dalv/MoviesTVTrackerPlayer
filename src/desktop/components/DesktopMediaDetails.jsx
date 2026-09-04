import { AnimatePresence, motion } from 'framer-motion';
import { MovieImage } from '../../shared/components/Poster';
import { Modal } from '../../shared/components/Modal';
import { DotsThreeVerticalIcon, PlayIcon, PlusIcon, XIcon, MagnifyingGlassIcon, ClockCounterClockwiseIcon, TrashIcon, CheckIcon } from '@phosphor-icons/react';
import { useWatchHistory } from '../../shared/contexts/WatchHistoryContext';
import { useVideoLibrary } from '../../shared/contexts/VideoLibraryContext';
import { InfoIcon } from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import { FixMatchModal } from './FixMatchModal';
import { RemoveMediaModal } from './RemoveMediaModal';
import { FileInfoModal } from './FileInfoModal';
export function DesktopMediaDetails({ media, tmdbId, navigate }) {
    const { history, setProgressAndSave, isLoaded: historyLoaded } = useWatchHistory(tmdbId);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const settingsRef = useRef(null);

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
            <div ref={settingsRef} className='fixed top-8 right-8 z-50 flex items-center gap-2'>
                <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-4xl px-3 py-2 noselect
                            transition-all duration-300 ${settingsOpen ? '-rotate-90 bg-black/50 rounded-l-2xl hover:bg-black/60' : 'rotate-0'}`}
                >
                    <DotsThreeVerticalIcon size={26} weight="bold" />

                </button>

                <button
                    onClick={() => navigate(-1)}
                    className="text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body transition-colors bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-full px-3 py-2 noselect"
                >
                    <XIcon size={24} weight="bold" />
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
                            className='top-[110%] right-[50%] z-40 absolute bg-black/50 text-body flex flex-col items-stretch p-2 rounded-2xl backdrop-blur-sm'
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
                                <span>View File Info</span>
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
            <div className='w-full relative z-20 grid grid-cols-[min(33vw,20rem)_minmax(0,1fr)] gap-12'>
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
                            {media.genres?.map(elem => (
                                <div key={elem} className='bg-white/6 rounded-full p-2 px-4 tracking-wide border border-white/8 backdrop-blur-sm shrink-0 whitespace-nowrap'>
                                    {elem}
                                </div>
                            ))}
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


                    <p className="text-xl text-body max-w-2/3">
                        {media.overview}
                    </p>
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
                    <button onClick={() => {setActiveModal(null); setProgressAndSave(0)}} className="px-4 py-2 bg-danger-600 text-white rounded-lg font-semibold hover:bg-danger-500 transition-colors cursor-pointer">Reset</button>
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
