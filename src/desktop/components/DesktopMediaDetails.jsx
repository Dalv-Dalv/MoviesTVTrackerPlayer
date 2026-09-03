import { motion } from 'framer-motion';
import { MovieImage } from '../../shared/components/Poster';
import { PlayIcon, PlusIcon, XIcon } from '@phosphor-icons/react';

export function DesktopMediaDetails({ media, tmdbId, navigate }) {
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
            <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => navigate(-1)}
                className="fixed top-8 right-8 text-white/80 z-50 cursor-pointer flex items-center gap-1 mb-6 hover:text-body transition-colors bg-black/10 hover:bg-black/40 active:bg-black/70 rounded-full px-3 py-2 noselect"
            >
                <XIcon size={24} weight="bold"/>

                <span className="font-semibold text-lg tracking-wide">
                    Close
                </span>
            </motion.button>

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

                        <div className='flex items-center gap-2 noselect mt-4 mb-6 text-muted w-full overflow-x-auto'>
                            {media.genres?.map(elem => (
                                <div key={elem} className='bg-white/6 rounded-full p-2 px-4 tracking-wide border border-white/8 backdrop-blur-sm shrink-0 whitespace-nowrap'>
                                    {elem}
                                </div>
                            ))}
                        </div>

                        

                        <div className='flex gap-4 noselect'>
                            <button
                                onClick={() => navigate(`/play/${tmdbId}`)}
                                className="bg-body text-black px-4 py-3 rounded-lg w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto"
                            >
                                <PlayIcon size={20} weight='fill' />
                                <span>Watch</span>
                            </button>

                            <button
                                onClick={() => navigate(`/play/${tmdbId}`)}
                                className="text-muted px-4 py-3 rounded-lg w-fit font-semibold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors bg-transparent hover:bg-black/40 hover:text-body"
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
        </div>
    );
}
