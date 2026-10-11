import { CaretRightIcon } from '@phosphor-icons/react';
import { MediaImage } from '../../../shared/components/MediaImage';
import { Carousel } from '../../../shared/components/Carousel';
import RingGlow from '../../../shared/components/RingGlow';

export function DesktopMediaCast({ media, compId, navigate }) {
    if (!media?.cast || media.cast.length === 0) return null;

    return (
        <div className='flex flex-col gap-4 w-4/5'>
            <div className='text-2xl w-fit flex items-center gap-1 noselect cursor-pointer group'>
                <h2 className='text-body'>
                    Credits & Cast
                </h2>
                <CaretRightIcon className='inline text-muted transition-colors duration-300 group-hover:text-body' />
            </div>

            <Carousel id={`cast-${compId}`} paddingClass="px-0 scroll-px-0">
                {media.cast.map((actor) => (
                    actor.profilePath && (
                        <div
                            key={actor.id}
                            onClick={() => navigate(`/details/person_${actor.id}`)}
                            className="w-32 md:w-40 flex flex-col shrink-0 group cursor-pointer"
                        >
                            <div className="isolate w-full aspect-2/3 relative rounded-lg overflow-hidden bg-background">
                                <MediaImage imagePath={actor.profilePath} className="w-full h-full object-cover" />
                                <RingGlow rounded="rounded-lg" />
                            </div>

                            <div className="flex flex-col mt-1.5 px-1">
                                <span className="font-medium text-white truncate" title={actor.name}>
                                    {actor.name}
                                </span>
                                <span className="text-sm text-gray-400 truncate" title={actor.character}>
                                    {actor.character}
                                </span>
                            </div>
                        </div>
                    )
                ))}
            </Carousel>
        </div>
    );
}

export function DesktopMediaCastSkeleton() {
    return (
        <div className='flex flex-col gap-4 w-4/5 animate-pulse'>
            <div className='w-40 h-8 bg-white/10 rounded-md' />
            <div className='flex gap-4 overflow-hidden'>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-32 md:w-40 flex flex-col shrink-0 gap-2">
                        <div className="w-full aspect-2/3 rounded-lg bg-white/10" />
                        <div className="w-24 h-4 bg-white/10 rounded" />
                        <div className="w-16 h-3 bg-white/5 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
