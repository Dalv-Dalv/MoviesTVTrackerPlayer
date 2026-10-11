import { CaretRightIcon, PlayIcon } from '@phosphor-icons/react';
import RingGlow from '../../../shared/components/RingGlow';

export function DesktopMediaTrailer({ media, trailerPlaying, setTrailerPlaying }) {
    if (!media?.trailerKey) return null;

    return (
        <div className="w-full flex flex-col gap-4 relative z-50 pointer-events-auto">
            <div className='text-2xl w-fit flex items-center gap-1 noselect cursor-pointer group'>
                <h2 className='text-body'>
                    Trailers & Media
                </h2>
                <CaretRightIcon className='inline text-muted transition-colors duration-300 group-hover:text-body' />
            </div>

            <div className='w-1/2 aspect-video'>
                {!trailerPlaying ? (
                    <div
                        className="w-full h-full relative cursor-pointer group bg-background rounded-2xl"
                        onClick={() => setTrailerPlaying(true)}
                    >
                        <img
                            src={`https://img.youtube.com/vi/${media.trailerKey}/maxresdefault.jpg`}
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://img.youtube.com/vi/${media.trailerKey}/hqdefault.jpg`; }}
                            alt="Trailer Thumbnail"
                            className='absolute inset-0 blur-lg opacity-50 rounded-2xl -z-10'
                        />

                        <img
                            src={`https://img.youtube.com/vi/${media.trailerKey}/maxresdefault.jpg`}
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://img.youtube.com/vi/${media.trailerKey}/hqdefault.jpg`; }}
                            alt="Trailer Thumbnail"
                            className="w-full h-full object-cover block rounded-2xl"
                        />

                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                            <div className="bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-sm rounded-full p-4 text-body transition-opacity duration-300">
                                <PlayIcon size={48} weight="fill" />
                            </div>
                        </div>

                        <RingGlow rounded="rounded-2xl" includeSolid />
                    </div>
                ) : (
                    <iframe
                        className="w-full h-full rounded-2xl"
                        src={`https://www.youtube.com/embed/${media.trailerKey}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&vq=hd1080`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                )}
            </div>
        </div>
    );
}

export function DesktopMediaTrailerSkeleton() {
    return (
        <div className="w-full flex flex-col gap-4 animate-pulse">
            <div className='w-44 h-8 bg-white/10 rounded-md' />
            <div className='w-1/2 aspect-video rounded-2xl bg-white/10' />
        </div>
    );
}
