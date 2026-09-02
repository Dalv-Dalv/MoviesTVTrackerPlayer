import { motion } from 'framer-motion';
import { MovieImage } from '../../shared/components/Poster';
import { PlayIcon } from '@phosphor-icons/react';

export function DesktopMediaDetails({ media, tmdbId, navigate }) {
    return (
        <div className="w-full flex-1 flex flex-row gap-12 items-end pb-12">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.5 }}
                className='absolute left-0 top-0 w-full pointer-events-none'
            >
                <MovieImage
                    relativePath={media.backdropPath}
                    className='mask-[linear-gradient(to_top,transparent,black_50%)] pointer-events-none'
                />
            </motion.div>

            <div className="w-1/3 max-w-80 shrink-0 aspect-2/3 relative z-10">
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
                    className="relative w-full h-full"
                >
                    <MovieImage
                        relativePath={media.posterPath}
                        altText={media.title}
                        className='absolute inset-0 blur-2xl opacity-50'
                    />

                    <div className="relative z-10 w-full h-full rounded-lg overflow-hidden shadow-2xl shadow-black/50">
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

            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.4, delay: 0.15, ease: "easeOut" }
                }}
                exit={{
                    opacity: 0,
                    x: -30,
                    transition: { duration: 0.15, ease: "easeIn" }
                }}
                transition={{ duration: 0.3 }}
                className="flex flex-col text-body relative z-10"
            >
                <h1 className="text-4xl font-bold tracking-wide mb-8">{media.title}</h1>
                <p className="text-xl text-body max-w-2/3">
                    {media.overview}
                </p>
                <button
                    onClick={() => navigate(`/play/${tmdbId}`)}
                    className="mt-8 bg-body backdrop-brightness-200 text-black px-4 py-3 rounded-lg w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto"
                >
                    <PlayIcon size={20} weight='fill' />
                    <span>Watch</span>
                </button>
            </motion.div>
        </div>
    );
}
