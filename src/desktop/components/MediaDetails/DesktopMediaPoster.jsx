import { motion } from 'framer-motion';
import { MediaImage } from '../../../shared/components/MediaImage';
import RingGlow from '../../../shared/components/RingGlow';

export function DesktopMediaPoster({ media, displayPoster, changingPosterType }) {
    return (
        <div className='w-full h-full relative pl-12 pt-[calc(100vh+1.5rem-min(33vw,20rem)*1.5)] noselect'>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                    opacity: 0,
                    y: 0,
                    transition: { duration: 0.4, ease: "easeIn" }
                }}
                transition={{
                    type: "tween",
                    ease: [0.5, 0, 0, 1],
                    duration: 0.7
                }}
                className="w-full max-w-80 z-10 sticky top-22"
            >
                <MediaImage
                    relativePath={displayPoster}
                    altText={media?.title}
                    className={`absolute w-full blur-2xl opacity-50 origin-bottom-left transition-transform duration-500 ${changingPosterType === 'poster' ? 'scale-105' : 'scale-100'}`}
                />

                <div className={`isolate relative z-10 w-full aspect-2/3 rounded-lg overflow-hidden shadow-2xl shadow-black/50 origin-bottom-left transition-transform duration-500 bg-background ${changingPosterType === 'poster' ? 'scale-105' : 'scale-100'}`}>
                    <MediaImage
                        relativePath={displayPoster}
                        altText={media?.title}
                        className='w-full h-full object-cover block'
                    />

                    <RingGlow rounded="rounded-lg" intensity="90" />
                </div>
            </motion.div>
        </div>
    );
}

export function DesktopMediaPosterSkeleton() {
    return (
        <div className='w-full h-full relative pl-12 pt-[calc(100vh+1.5rem-min(33vw,20rem)*1.5)] noselect'>
            <div className="w-full max-w-80 z-10 sticky top-22">
                <div className="w-full aspect-2/3 rounded-lg bg-white/10 animate-pulse shadow-2xl shadow-black/50" />
            </div>
        </div>
    );
}
