import { motion } from 'framer-motion';
import { PlayIcon, PlusIcon } from '@phosphor-icons/react';
import { ExpandableText } from '../../../shared/components/ExpandableText';
import { MediaImage } from '../../../shared/components/MediaImage';
import { formatRuntime } from '../../../shared/utils/PlayerUtils';
import { getResumeEpisode } from '../../../shared/store/useWatchHistoryStore';

export function DesktopMediaHeroInfo({
    media,
    compId,
    navigate,
    changingPosterType,
    displayLogo,
    movieGenres,
    tvGenres,
    historyLoaded,
    history,
}) {
    let playButtonText = 'Play';
    let resumeData = null;
    if (historyLoaded && media) {
        if (media.type === 'show' && history?.lastPlayedSeason != null) {
            resumeData = getResumeEpisode(history, media);
            if (resumeData) {
                playButtonText = `Resume S${resumeData.season} E${resumeData.episode}`;
            }
        } else if (media.type === 'movie' && history?.progress > 0 && !history?.completed) {
            playButtonText = 'Resume';
        }
    }

    const releaseYear = media?.releaseDate?.split('-')[0] || 'Unknown Year';
    const runtimeText = media?.type === 'movie'
        ? `${formatRuntime(media.runtime)}`
        : `${media?.seasons?.length || 0} Season${(media?.seasons?.length || 0) > 1 ? 's' : ''}`;

    const handlePlay = () => {
        if (media?.type === 'show' && resumeData) {
            navigate(`/play/${compId}?s=${resumeData.season}&e=${resumeData.episode}`);
        } else {
            navigate(`/play/${compId}`);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 0, transition: { duration: 0.4, ease: "easeIn" } }}
            transition={{ type: "tween", ease: [0.5, 0, 0, 1], duration: 0.7 }}
            className='h-screen p-12 pl-0 text-body relative z-10'
        >
            <div className={`w-full h-full flex flex-col gap-2 justify-end transition-opacity duration-300 ${changingPosterType ? 'opacity-0' : 'opacity-100'}`}>
                <h1 className='text-4xl font-bold tracking-wide text-shadow-lg'>
                    {media.title}
                </h1>

                <div className='text-muted tracking-wide font-semibold text-shadow-sm flex gap-4'>
                    <span className='shrink-0'>{releaseYear}</span>
                    <span className='shrink-0'>{runtimeText}</span>

                    <div className='flex items-center gap-1 noselect text-muted w-full'>
                        {(media.genreIds || media.genres || []).map((id, index, arr) => {
                            const dict = media.type === 'show' ? tvGenres : movieGenres;
                            const text = dict?.[id] || id;
                            return (
                                <div key={id} className='flex items-center gap-1 tracking-wide shrink-0 whitespace-nowrap'>
                                    <span>{text}</span>
                                    {index < arr.length - 1 && <span>•</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col mb-2 text-body z-20 relative">
                    <ExpandableText
                        text={media.overview}
                        className="max-w-4/5 tracking-wide"
                        lineClampClass="line-clamp-3"
                        showLessText="Show less..."
                    />
                </div>

                <div className='flex gap-2 noselect'>
                    {media?.isDownloaded ? (
                        <button
                            onClick={handlePlay}
                            className="bg-body text-black px-3 py-2 rounded-lg w-fit font-bold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:bg-body/90"
                        >
                            <PlayIcon size={20} weight='fill' />
                            <span>{playButtonText}</span>
                        </button>
                    ) : (
                        <div className="ring-inset ring-2 ring-muted text-muted px-3 py-2 rounded-lg w-fit font-bold flex flex-row items-center justify-center gap-2 relative z-50">
                            <PlayIcon size={20} weight='bold' />
                            <span>Unavailable</span>
                        </div>
                    )}

                    <button
                        onClick={handlePlay}
                        className="text-muted px-3 py-2 rounded-lg w-fit font-semibold flex flex-row items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto transition-colors hover:text-body"
                    >
                        <PlusIcon size={20} weight='bold' />
                        <span>Add to watch list</span>
                    </button>
                </div>
            </div>

            <div className={`absolute inset-0 bottom-12 flex flex-col justify-end pointer-events-none transition-opacity duration-300 ${!changingPosterType ? 'opacity-0' : 'opacity-100'} origin-bottom-left transition-transform duration-500 ${changingPosterType === 'logo' ? 'scale-105' : 'scale-100'}`}>
                {displayLogo ? (
                    <MediaImage
                        relativePath={displayLogo}
                        altText={media.title}
                        className='w-fit max-w-1/2 max-h-1/2'
                    />
                ) : (
                    <h1 className='text-4xl font-bold tracking-wide'>
                        {media.title}
                    </h1>
                )}
            </div>
        </motion.div>
    );
}

export function DesktopMediaHeroInfoSkeleton() {
    return (
        <div className='h-screen p-12 pl-0 flex flex-col gap-4 justify-end'>
            <div className='w-2/3 h-10 bg-white/10 rounded-lg animate-pulse' />
            <div className='w-1/3 h-6 bg-white/10 rounded-md animate-pulse' />
            <div className='w-4/5 h-16 bg-white/5 rounded-md animate-pulse' />
            <div className='flex gap-2 pt-2'>
                <div className='w-28 h-10 bg-white/10 rounded-lg animate-pulse' />
                <div className='w-36 h-10 bg-white/5 rounded-md animate-pulse' />
            </div>
        </div>
    );
}
