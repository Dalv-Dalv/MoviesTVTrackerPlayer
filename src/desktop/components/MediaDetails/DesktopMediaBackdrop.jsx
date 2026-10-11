import { motion } from 'framer-motion';
import { ArrowLeftIcon, DotsThreeVerticalIcon, MagnifyingGlassIcon, InfoIcon, ImageSquareIcon, ClockCounterClockwiseIcon, TrashIcon } from '@phosphor-icons/react';
import { MediaImage } from '../../../shared/components/MediaImage';
import { Dropdown } from '../../../shared/components/Dropdown';

export function DesktopMediaBackdrop({
    displayBackdrop,
    backdropY,
    changingPosterType,
    navigate,
    media,
    onOpenModal,
    setChangingPosterType,
}) {
    return (
        <>
            {/* Backdrop */}
            <div className='absolute top-0 inset-x-0 max-h-screen overflow-hidden pointer-events-none noselect'>
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className='relative w-full h-full'
                >
                    <motion.div style={{ y: backdropY }} className="w-full h-full">
                        <MediaImage
                            relativePath={displayBackdrop}
                            className={`w-full pointer-events-none transition-transform duration-500 ${changingPosterType === 'backdrop' ? 'scale-101' : 'scale-100'}`}
                        />
                    </motion.div>
                </motion.div>
                <div className="absolute inset-0 bg-linear-to-t from-black from-1% to-transparent to-60% pointer-events-none" />
            </div>

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
        </>
    );
}

export function DesktopMediaBackdropSkeleton({ navigate }) {
    return (
        <>
            <div className='absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none noselect bg-neutral-900/40 animate-pulse'>
                <div className="absolute inset-0 bg-linear-to-t from-black from-1% to-transparent to-60%" />
            </div>

            <div className='absolute inset-0 top-[100vh] bg-background' />

            <div className='fixed top-6 inset-x-6 z-50 flex items-center justify-between gap-2 pointer-events-none'>
                <button
                    onClick={() => navigate(-1)}
                    className="text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body transition-colors bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-full px-3 py-2 noselect pointer-events-auto"
                >
                    <ArrowLeftIcon size={25} weight='bold' />
                </button>
            </div>
        </>
    );
}
