import { ProfileImage } from '../../../shared/components/ProfileImage';

export function MobileMediaCast({ media, navigate }) {
    if (!media?.cast || media.cast.length === 0) return null;

    return (
        <div className='flex flex-col gap-4 text-body noselect overflow-hidden w-full px-4 ml:px-6 mt-4'>
            <div className='flex overflow-x-auto gap-4 pb-4 -mb-4 -mx-4 px-4'>
                {media.cast.map((actor) => (
                    <div 
                        key={actor.id} 
                        onClick={() => navigate(`/details/person_${actor.id}`)}
                        className="w-28 flex flex-col shrink-0 group snap-start cursor-pointer"
                    >
                        <ProfileImage imagePath={actor.profilePath} className="w-full aspect-2/3 rounded-lg" />

                        <div className="flex flex-col mt-1.5 px-1">
                            <span className="font-medium text-white truncate text-sm" title={actor.name}>
                                {actor.name}
                            </span>
                            <span className="text-xs text-gray-400 truncate" title={actor.character}>
                                {actor.character}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function MobileMediaCastSkeleton() {
    return (
        <div className='flex flex-col gap-4 text-body overflow-hidden w-full px-4 ml:px-6 mt-4 animate-pulse'>
            <div className='flex overflow-x-auto gap-4 pb-4 -mb-4 -mx-4 px-4'>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-28 flex flex-col shrink-0 gap-1.5">
                        <div className="w-full aspect-2/3 rounded-lg bg-white/10" />
                        <div className="w-20 h-3.5 bg-white/10 rounded" />
                        <div className="w-14 h-3 bg-white/5 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
