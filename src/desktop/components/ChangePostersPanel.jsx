import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MovieImage } from '../../shared/components/MovieImage';
import { getAllImages } from '../../shared/services/TMDBMetadata';
import { useTMDB } from '../../shared/hooks/useTMDB';
import { useLibraryStore } from '../../shared/store/useLibraryStore';


export function ChangePostersPanel({ media, changingPosterType, setChangingPosterType, newPosterUrls, setNewPosterUrls }) {
    const tmdb = useTMDB();
    const updateMediaPosters = useLibraryStore(state => state.updateMediaPosters);
    const [availableImages, setAvailableImages] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const scrollRef = useRef(null);

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
            await updateMediaPosters(media.tmdbId, newPosterUrls);
            setChangingPosterType(null);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {changingPosterType && (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className='absolute z-50 right-10 w-100 top-10 h-[calc(100vh-5rem)] flex flex-col items-center justify-end gap-4 noselect bg-surface/90 backdrop-brightness-50 backdrop-blur-lg border border-white/10 shadow-xl shadow-background/50 rounded-xl py-4'
                >
                    <div className='flex self-stretch text-body bg-white/5 rounded-xl overflow-hidden border border-white/8 cursor-pointer mx-4'>
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

                    <div ref={scrollRef} className="flex-1 w-full overflow-y-auto flex flex-wrap gap-4 rounded-lg px-4">
                        {availableImages && availableImages[`${changingPosterType}s`]?.map((elem, i) => {
                            const isSelected = newPosterUrls[changingPosterType] === elem.key;
                            const itemWidth = changingPosterType === 'poster' ? 'w-[calc(50%-0.5rem)]' : 'w-full';
                            const itemAspect = changingPosterType === 'poster' ? '2/3' : changingPosterType === 'backdrop' ? '16/9' : '16/9';

                            return (
                                <div 
                                    key={`${elem.key}-${i}`} 
                                    className={`relative ${itemWidth} rounded-lg overflow-hidden cursor-pointer group`}
                                    style={{ aspectRatio: itemAspect }}
                                    onClick={() => setNewPosterUrls(prev => ({ ...prev, [changingPosterType]: elem.key }))}
                                >
                                    <MovieImage imagePath={elem.half} className={`absolute inset-0 w-full h-full ${changingPosterType === 'logo' ? 'object-contain p-4' : 'object-cover'}`}/>

                                    {changingPosterType !== 'logo' ? (
                                        <>
                                            <div className={`absolute rounded-lg inset-0 ring-0 ${isSelected && 'ring-4'} ring-inset ring-primary/70 pointer-events-none transition-shadow`}/>
                                            <div className='absolute rounded-lg inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light transition-shadow group-hover:ring-4' />
                                        </>
                                    ) : (
                                        <>
                                            <div className={`absolute rounded-lg inset-0 ring-inset ${isSelected ? 'ring-4 ring-primary/70' : 'ring-1 ring-transparent'} pointer-events-none transition-shadow`}/>
                                            <div className='absolute rounded-lg inset-0 ring-1 ring-inset ring-white/10 pointer-events-none transition-shadow group-hover:ring-4' />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-4 justify-end w-full mt-2 px-4">
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
