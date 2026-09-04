import { motion } from 'framer-motion';
import { MovieImage } from '../../shared/components/Poster';
import { PlayIcon } from '@phosphor-icons/react';

export function MobileMediaDetails({ media, tmdbId, navigate }) {
    return (
        <div className="w-full flex-1 flex flex-col gap-6 items-center overflow-y-auto pb-12 pt-8 relative z-10 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: 0.15, ease: "easeIn" }
                }}
                transition={{
                    type: "tween",
                    ease: [0.5, 0, 0, 1],
                    duration: 0.5
                }}
                className="w-full pt-10 shrink-0 aspect-2/3 relative"
            >
                <MovieImage
                    relativePath={media.posterPath}
                    altText={media.title}
                    className='w-2/3 absolute inset-0 blur-2xl opacity-50'
                />

                <div className="relative z-10 w-full h-full rounded-lg shadow-2xl shadow-black/50 bg-neutral-900">
                    <MovieImage
                        relativePath={media.posterPath}
                        altText={media.title}
                        className='w-full h-full object-cover block'
                    />
                    <div className="absolute rounded-lg inset-0 ring-2 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                    <div className="absolute rounded-lg inset-0 ring-2 ring-inset ring-white/8 pointer-events-none" />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.4, delay: 0.1, ease: "easeOut" }
                }}
                exit={{
                    opacity: 0,
                    y: -20,
                    transition: { duration: 0.15, ease: "easeIn" }
                }}
                className="flex flex-col items-center text-center text-body w-full max-w-md"
            >
                <h1 className="text-3xl font-bold tracking-wide mb-4 leading-tight">{media.title}</h1>
                <p className="text-base text-body/90 leading-relaxed mb-8">
                    {media.overview}
                </p>
                <button
                    onClick={() => navigate(`/play/${tmdbId}`)}
                    className="bg-body backdrop-brightness-200 text-background px-8 py-3.5 rounded-full w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-transform"
                >
                    <PlayIcon size={24} weight='fill' />
                    <span className="text-lg">Watch</span>
                </button>
            </motion.div>
        </div>
    );
}
