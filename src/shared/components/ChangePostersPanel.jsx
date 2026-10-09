import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { getAllImages } from '../services/TMDBMetadata';
import { useTMDB } from '../hooks/useTMDB';
import { useLibraryStore } from '../store/useLibraryStore';
import { isMobile } from '../utils/PlatformUtils';
import { MediaImage } from './MediaImage';
import RingGlow from './RingGlow';

export function ChangePostersPanel({ media, changingPosterType, setChangingPosterType, newPosterUrls, setNewPosterUrls }) {
    const tmdb = useTMDB();
    const updateMediaPosters = useLibraryStore(state => state.updateMediaPosters);
    const [availableImages, setAvailableImages] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const scrollRef = useRef(null);
    const dragControls = useDragControls();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [changingPosterType]);

    useEffect(() => {
        async function getData() {
            if (!media) return;
            const data = await getAllImages(tmdb, media.tmdbId, media.type === 'show');
            setAvailableImages(data);
        }

        if (changingPosterType && !availableImages) {
            getData();
        }
    }, [changingPosterType, media, tmdb, availableImages]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const compId = `${media.type}_${media.tmdbId}`;
            await updateMediaPosters(compId, newPosterUrls);
            setChangingPosterType(null);
        } finally {
            setIsSaving(false);
        }
    };

    const panelClass = isMobile
        ? 'fixed z-50 mp:inset-x-4 bottom-4 mp:h-[55dvh] ml:w-[40dvw] ml:inset-y-4 ml:right-4 flex flex-col bg-surface items-center justify-start gap-4 noselect border border-white/10 shadow-xl shadow-background/50 rounded-3xl p-4 overflow-hidden'
        : 'absolute z-50 right-10 w-100 top-10 h-[calc(100vh-5rem)] flex flex-col items-center justify-end gap-4 noselect bg-surface border border-white/10 shadow-xl shadow-background/50 rounded-3xl p-4 overflow-hidden';

    return (
        <AnimatePresence>
            {changingPosterType && (
                <motion.div
                    initial={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, x: 20 }}
                    animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
                    exit={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    drag={isMobile ? "y" : false}
                    dragControls={isMobile ? dragControls : undefined}
                    dragListener={!isMobile}
                    dragConstraints={isMobile ? { top: 0, bottom: 0 } : undefined}
                    dragElastic={isMobile ? { top: 0, bottom: 1 } : undefined}
                    onDragEnd={isMobile ? (e, info) => {
                        if (info.offset.y > 100 || info.velocity.y > 500) {
                            setChangingPosterType(null);
                        }
                    } : undefined}
                    className={panelClass}
                >
                    {isMobile && (
                        <div
                            className="w-full h-4 shrink-0 -m-4 bg-transparent flex items-center justify-center"
                            onPointerDown={(e) => dragControls.start(e)}
                            style={{ touchAction: 'none' }}
                        >
                            <div className='rounded-full w-16 h-0.5 bg-white/20 pointer-events-none' />
                        </div>
                    )}

                    <div
                        className='flex self-stretch text-body bg-white/5 rounded-xl overflow-hidden border border-white/8 cursor-pointer shrink-0'
                        onPointerDown={(e) => dragControls.start(e)}
                        style={{ touchAction: 'none' }}
                    >
                        <div onClick={() => setChangingPosterType('poster')} className={`flex-1 text-center py-2 transition-colors ${changingPosterType === 'poster' ? 'bg-white/10' : 'text-muted hover:bg-white/5'}`}>
                            Poster
                        </div>
                        <div onClick={() => setChangingPosterType('backdrop')} className={`flex-1 text-center py-2 transition-colors ${changingPosterType === 'backdrop' ? 'bg-white/10' : 'text-muted hover:bg-white/5'}`}>
                            Backdrop
                        </div>
                        <div onClick={() => setChangingPosterType('logo')} className={`flex-1 text-center py-2 transition-colors ${changingPosterType === 'logo' ? 'bg-white/10' : 'text-muted hover:bg-white/5'}`}>
                            Logo
                        </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 w-full overflow-y-auto flex flex-wrap gap-4 rounded-lg">
                        {!availableImages ? (
                            <div className="w-full h-full flex items-center justify-center text-muted">
                                Loading...
                            </div>
                        ) : availableImages[`${changingPosterType}s`]?.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-muted">
                                No {changingPosterType}s available.
                            </div>
                        ) : (
                            availableImages[`${changingPosterType}s`]?.map((elem, i) => {
                                const isSelected = newPosterUrls[changingPosterType] === elem.key;
                                const itemWidth = changingPosterType === 'poster' ? 'w-[calc(50%-0.5rem)]' : 'w-full';
                                const itemAspect = changingPosterType === 'poster' ? '2/3' : '16/9';

                                return (
                                    <div
                                        key={`${elem.key}-${i}`}
                                        className={`isolate relative ${itemWidth} rounded-lg overflow-hidden cursor-pointer group shrink-0`}
                                        style={{ aspectRatio: itemAspect }}
                                        onClick={() => setNewPosterUrls(prev => ({ ...prev, [changingPosterType]: elem.key }))}
                                    >
                                        <MediaImage imagePath={elem.half} className={`absolute inset-0 w-full h-full transition-[padding] ${changingPosterType === 'logo' ? 'object-contain p-4' : 'object-cover'}`} />

                                        {changingPosterType !== 'logo' ? (
                                            <>
                                                <div className={`absolute rounded-lg inset-0 ring-0 ${isSelected && 'ring-4'} ring-inset ring-primary/70 pointer-events-none transition-shadow`} />
                                                <RingGlow rounded="rounded-lg" hover={!isMobile} />
                                            </>
                                        ) : (
                                            <>
                                                <div className={`absolute rounded-lg inset-0 ring-inset ${isSelected ? 'ring-4 ring-primary/70' : 'ring-1 ring-transparent'} pointer-events-none transition-shadow`} />
                                                <div className={`absolute rounded-lg inset-0 ring-1 ring-inset ring-white/10 pointer-events-none transition-shadow ${!isMobile && 'group-hover:ring-4'}`} />
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="flex gap-4 justify-end w-full shrink-0">
                        <button disabled={isSaving} onClick={() => setChangingPosterType(null)} className="px-4 py-2 rounded-lg hover:bg-divider transition-colors cursor-pointer text-muted">
                            Cancel
                        </button>

                        <button disabled={isSaving} onClick={handleSave} className="px-4 py-2 bg-body text-black rounded-lg font-semibold hover:bg-body/70 transition-colors disabled:opacity-50 cursor-pointer">
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

