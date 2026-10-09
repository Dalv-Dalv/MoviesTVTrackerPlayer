import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { XIcon, CaretLeftIcon, CaretRightIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { MediaImage } from './MediaImage';
import RingGlow from './RingGlow';

export function ProfilePicturesModal({ isOpen, onClose, pictures }) {
    const [selectedIndex, setSelectedIndex] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setSelectedIndex(null);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedIndex === null) return;
            if (e.key === 'ArrowLeft') {
                setSelectedIndex(Math.max(0, selectedIndex - 1));
            } else if (e.key === 'ArrowRight') {
                setSelectedIndex(Math.min(pictures.length - 1, selectedIndex + 1));
            } else if (e.key === 'Escape') {
                setSelectedIndex(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, pictures]);

    const gridScrollRef = useRef(null);

    const handleGridScroll = () => {
        if (!gridScrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = gridScrollRef.current;
        const maxScroll = scrollHeight - clientHeight;
        const distanceToBottom = maxScroll - scrollTop;

        let alphaBottom = 1 - (distanceToBottom / 40);
        if (alphaBottom < 0) alphaBottom = 0;
        if (alphaBottom > 1) alphaBottom = 1;

        let alphaTop = 1 - (scrollTop / 40);
        if (alphaTop < 0) alphaTop = 0;
        if (alphaTop > 1) alphaTop = 1;

        gridScrollRef.current.style.setProperty('--mask-alpha-bottom', alphaBottom.toFixed(2));
        gridScrollRef.current.style.setProperty('--mask-alpha-top', alphaTop.toFixed(2));
    };

    useEffect(() => {
        if (isOpen && selectedIndex === null) {
            setTimeout(handleGridScroll, 50);
        }
    }, [isOpen, selectedIndex, pictures]);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Media" className="max-w-[60vw] h-[90vh] rounded-[36px]" hideHeader unstyledBody>
            <AnimatePresence mode="wait">
                {selectedIndex === null ? (
                    <motion.div
                        key="grid-view"
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex flex-col"
                    >
                        {/* Grid Scrollable Area */}
                        <div
                            ref={gridScrollRef}
                            onScroll={handleGridScroll}
                            className="flex-1 h-full overflow-y-auto p-6"
                            style={{
                                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0, var(--mask-alpha-top, 0)) 0px, black 40px, black calc(100% - 40px), rgba(0,0,0, var(--mask-alpha-bottom, 0)) 100%)',
                                maskImage: 'linear-gradient(to bottom, rgba(0,0,0, var(--mask-alpha-top, 0)) 0px, black 40px, black calc(100% - 40px), rgba(0,0,0, var(--mask-alpha-bottom, 0)) 100%)'
                            }}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {pictures.map((elem, index) => (
                                    <div
                                        key={`Grid_${elem.url}_${index}`}
                                        className='relative isolate aspect-2/3 bg-surface rounded-xl overflow-hidden group cursor-pointer transition-all shadow-lg'
                                        onClick={() => setSelectedIndex(index)}
                                    >
                                        <MediaImage imagePath={elem.url} className='w-full h-full object-cover' />

                                        <RingGlow hover rounded='rounded-xl' />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="detail-view"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex flex-col"
                    >
                        {/* Main Photo Viewer */}
                        <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0 w-full p-6">

                            {/* Empty Left Placeholder */}
                            {selectedIndex === 0 && (
                                <div className="hidden sm:flex flex-1 min-w-0 h-full px-4 md:px-8 justify-end" />
                            )}

                            {pictures.map((pic, index) => {
                                const offset = index - selectedIndex;
                                const isFocused = offset === 0;
                                const isHidden = Math.abs(offset) > 1;
                                const isPrev = offset < 0;

                                return (
                                    <motion.div
                                        key={`wrapper-${pic.urlFull}`}
                                        layout
                                        transition={{ type: "tween", ease: [0.25, 1, 0.5, 1], duration: 0.4 }}
                                        className={
                                            isHidden
                                                ? `absolute top-1/2 -translate-y-1/2 h-[40%] aspect-2/3 pointer-events-none z-0 ${isPrev ? '-left-12 -translate-x-full' : '-right-12 translate-x-full'}`
                                                : isFocused
                                                    ? "shrink-0 relative flex items-center justify-center h-full aspect-2/3 max-w-[85vw] sm:max-w-[45vw] md:max-w-[40vw] lg:max-w-[35vw] z-10"
                                                    : `hidden sm:flex flex-1 min-w-0 items-center h-full px-4 md:px-8 ${isPrev ? 'justify-end' : 'justify-start'}`
                                        }
                                    >
                                        <motion.div
                                            layout
                                            initial={false}
                                            animate={{ opacity: isHidden ? 0 : isFocused ? 1 : 0.5 }}
                                            transition={{ type: "tween", ease: [0.25, 1, 0.5, 1], duration: 0.4 }}
                                            className={
                                                isHidden
                                                    ? "w-full h-full relative rounded-xl shadow-lg bg-white/5"
                                                    : isFocused
                                                        ? "w-full h-full relative"
                                                        : "h-[50%] md:h-[60%] lg:h-[70%] max-h-full aspect-2/3 relative rounded-xl shadow-lg bg-white/5"
                                            }
                                        >
                                            <MediaImage
                                                imagePath={pic.urlFull}
                                                lazy={false}
                                                className={`w-full h-full object-cover shadow-2xl bg-white/5 ${(isFocused || isHidden) ? 'rounded-2xl' : 'rounded-xl pointer-events-none'}`}
                                            />

                                            {/* Mobile Navigation Overlays */}
                                            {isFocused && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedIndex(Math.max(0, index - 1)); }}
                                                        className={`absolute -left-4 sm:hidden p-3 rounded-full bg-black/40 hover:bg-black/60 text-body transition-colors z-40 ${index === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'}`}
                                                    >
                                                        <CaretLeftIcon size={24} weight="bold" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedIndex(Math.min(pictures.length - 1, index + 1)); }}
                                                        className={`absolute -right-4 sm:hidden p-3 rounded-full bg-black/40 hover:bg-black/60 text-body transition-colors z-40 ${index === pictures.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'}`}
                                                    >
                                                        <CaretRightIcon size={24} weight="bold" />
                                                    </button>
                                                </>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                );
                            })}

                            {/* Empty Right Placeholder */}
                            {selectedIndex === pictures.length - 1 && (
                                <div className="hidden sm:flex flex-1 min-w-0 h-full px-4 md:px-8 justify-start" />
                            )}

                            <div className='absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-surface to-transparent pointer-events-none z-10' />
                            <div className='absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-surface to-transparent pointer-events-none z-10' />

                            {/* Desktop Clickable Regions with Carets */}
                            {selectedIndex > 0 && (
                                <div
                                    className="hidden sm:flex absolute inset-y-0 left-0 w-1/4 p-6 items-center justify-start z-20 cursor-pointer opacity-0 hover:opacity-100 transition-all text-body drop-shadow-xl group"
                                    onClick={() => setSelectedIndex(selectedIndex - 1)}
                                >
                                    <div className="group-hover:scale-110 transition-transform text-muted">
                                        <CaretLeftIcon size={48} weight="bold" />
                                    </div>
                                </div>
                            )}
                            {selectedIndex < pictures.length - 1 && (
                                <div
                                    className="hidden sm:flex absolute inset-y-0 right-0 w-1/4 p-6 items-center justify-end z-20 cursor-pointer opacity-0 hover:opacity-100 transition-all text-body drop-shadow-xl group"
                                    onClick={() => setSelectedIndex(selectedIndex + 1)}
                                >
                                    <div className="group-hover:scale-110 transition-transform text-muted">
                                        <CaretRightIcon size={48} weight="bold" />
                                    </div>
                                </div>
                            )}

                        </div>

                        <button
                            onClick={() => setSelectedIndex(null)}
                            className="absolute bottom-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 text-muted hover:text-body transition-colors cursor-pointer bg-black/20"
                        >
                            <SquaresFourIcon size={24} weight="fill" />
                            <span className="font-medium text-sm md:text-base">View All</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </Modal>
    );
}
