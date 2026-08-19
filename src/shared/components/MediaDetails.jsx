import { motion } from 'framer-motion';
import { MovieImage } from './Poster';
import { PlayIcon } from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVideoLibrary } from '../contexts/VideoLibraryContext';
import { isMobile } from '../utils/PlatformUtils';

export function MediaDetails({ className = '' }) {
    const { tmdbId } = useParams();
    const navigate = useNavigate();
    const { library } = useVideoLibrary();

    const media = library[tmdbId];

    if (!media) return (
        <div className="flex items-center justify-center h-full text-white">
            <h2>Movie not found!</h2>
            <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );

    return (
        <motion.div className={`absolute inset-0 z-50 flex flex-col items-center p-12 pt-22 gap-12 ${className}`}>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/95 backdrop-blur-xl -z-10"
            />

            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.5 }}
                className='absolute top-0 pointer-events-none'
            >
                <MovieImage
                    relativePath={media.backdropPath}
                    className='mask-[linear-gradient(to_top,transparent,black_50%)] pointer-events-none'
                />
            </motion.div>

            <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => navigate(-1)}
                className="absolute top-20 right-8 text-white z-50 cursor-pointer"
            >
                Close
            </motion.button>


            <div className='w-full h-screen flex flex-row gap-12 items-end'>
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

                        <div className="relative z-10 w-full h-full rounded-lg overflow-hidden shadow-2xl shadow-black/50 bg-neutral-900">
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
        </motion.div>
    );
}