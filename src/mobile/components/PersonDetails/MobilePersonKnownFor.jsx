import { useNavigate } from "react-router-dom";
import { Carousel } from "../../../shared/components/Carousel";
import { MediaImage } from "../../../shared/components/MediaImage";
import RingGlow from "../../../shared/components/RingGlow";

export function MobilePersonKnownFor({ knownForCredits }) {
    const navigate = useNavigate();

    if (!knownForCredits || knownForCredits.length === 0) return null;

    return (
        <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-muted mb-2">Known For</h2>
            <Carousel id="person-known-for" saveScroll={false} paddingClass="px-0 pb-3">
                {knownForCredits.map(credit => {
                    const compId = `${credit.media_type === 'tv' ? 'show' : 'movie'}_${credit.id}`;

                    return (
                        <div
                            key={compId}
                            onClick={() => navigate(`/details/${compId}`)}
                            className="group flex flex-col gap-1 cursor-pointer w-24 sm:w-28 lg:w-32 shrink-0 snap-start"
                        >
                            <div className="relative w-full aspect-2/3 rounded-lg overflow-hidden transition-shadow shadow-sm group-hover:shadow-lg group-active:scale-95 transition-transform duration-150 bg-background">
                                <MediaImage
                                    imagePath={credit.posterPath}
                                    className="w-full h-full"
                                />

                                <RingGlow rounded="rounded-lg" hover />
                            </div>

                            <p className="text-xs sm:text-sm text-center text-muted truncate px-1 group-hover:text-body transition-colors">
                                {credit.character}
                            </p>
                        </div>
                    );
                })}
            </Carousel>
        </div>
    );
}

export function MobilePersonKnownForSkeleton() {
    return (
        <div className="animate-pulse">
            <h2 className="text-xl sm:text-2xl font-semibold text-muted mb-2 opacity-50">Known For</h2>
            <div className="flex gap-4 overflow-hidden pb-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="group flex flex-col gap-1 w-24 sm:w-28 lg:w-32 shrink-0">
                        <div className="w-full aspect-2/3 bg-white/10 rounded-lg" />
                        <div className="w-3/4 h-3 bg-white/10 rounded mx-auto mt-1" />
                    </div>
                ))}
            </div>
        </div>
    );
}
