import { useNavigate } from "react-router-dom";
import { Carousel } from "../../../shared/components/Carousel";
import { MediaImage } from "../../../shared/components/MediaImage";

export function MobilePersonCredits({ person, credits, knownForCredits }) {
    const navigate = useNavigate();
    
    return (
        <div className="flex flex-col gap-4">
            {knownForCredits.length > 0 && (
                <div className="mt-4">
                    <h2 className="text-2xl font-semibold mb-6">Known For</h2>
                    <Carousel id="person-known-for" saveScroll={false} paddingClass="px-0 pb-4">
                        {knownForCredits.slice(0, 20).map(credit => {
                            const title = credit.title || credit.name;
                            const mediaType = credit.media_type === 'tv' ? 'show' : 'movie';

                            return (
                                <div
                                    key={credit.credit_id || credit.id}
                                    onClick={() => navigate(`/details/${mediaType}_${credit.id}`)}
                                    className="group flex flex-col gap-2 cursor-pointer w-28 shrink-0 snap-start"
                                >
                                    <div className="w-full aspect-[2/3] bg-white/5 rounded-xl overflow-hidden ring-1 ring-white/10 active:scale-95 transition-all duration-300">
                                        <MediaImage
                                            imagePath={credit.posterPath}
                                            altText={title}
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <p className="text-xs font-medium text-center truncate px-1 transition-colors">{title}</p>
                                </div>
                            );
                        })}
                    </Carousel>
                </div>
            )}

            {credits && credits.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-6">Timeline</h2>
                    <div className="flex flex-col border-l border-white/10 ml-4 pb-8">
                        {credits.map((credit, i) => {
                            const compId = `${credit.media_type === 'tv' ? 'show' : 'movie'}_${credit.id}`;
                            const role = credit.character || credit.job || (credit.jobs && credit.jobs.join(', ')) || 'Unknown Role';
                            const title = credit.title || credit.name;
                            const year = credit.year || '—';

                            const isSelf = /\b(self|himself|herself)\b/i.test(credit.character || '');
                            const jobs = credit.isCast ? [(isSelf ? "Self" : (person.gender === 1 ? "Actress" : "Actor")), ...(credit.jobs || [])] : (credit.jobs || []);

                            return (
                                <div
                                    key={`${compId}-${i}`}
                                    onClick={() => navigate(`/details/${compId}`)}
                                    className="relative pl-6 py-4 flex gap-4 items-center group cursor-pointer hover:bg-white/5 transition-colors rounded-r-lg"
                                >
                                    <div className="absolute -left-1.25 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/30 group-hover:bg-white group-hover:scale-150 transition-all" />
                                    <span className="w-12 text-sm text-muted shrink-0 text-center">{year}</span>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-body group-hover:text-white transition-colors">{title}</span>
                                        <span className="text-sm text-muted">
                                            {jobs.map((job, idx) => (
                                                <span key={idx} className="mr-2 border border-white/20 text-[10px] px-1 rounded text-white/50 uppercase">
                                                    {job}
                                                </span>
                                            ))}
                                            {role}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export function MobilePersonCreditsSkeleton() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            <div className="mt-4">
                <div className="w-40 h-8 bg-white/10 rounded-md mb-6" />
                <div className="flex gap-4 overflow-hidden pb-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col gap-2 w-28 shrink-0">
                            <div className="w-full aspect-[2/3] bg-white/10 rounded-xl" />
                            <div className="w-3/4 h-3 bg-white/10 rounded mx-auto" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8">
                <div className="w-40 h-8 bg-white/10 rounded-md mb-6" />
                <div className="flex flex-col border-l border-white/10 ml-4 pb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="relative pl-6 py-4 flex gap-4 items-center">
                            <div className="absolute -left-1.25 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/10" />
                            <span className="w-12 h-4 bg-white/10 rounded shrink-0" />
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="w-3/4 h-5 bg-white/10 rounded" />
                                <div className="w-1/2 h-3 bg-white/10 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
