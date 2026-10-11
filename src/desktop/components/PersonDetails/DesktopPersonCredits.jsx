import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Carousel } from "../../../shared/components/Carousel";
import { MediaImage } from "../../../shared/components/MediaImage";
import RingGlow from "../../../shared/components/RingGlow";

export function DesktopPersonCredits({ person, credits, knownForCredits, roles }) {
    const navigate = useNavigate();
    const [chips, setChips] = useState([{ name: "Movies", isActive: true, count: undefined }, { name: "TV Shows", isActive: true, count: undefined }]);
    
    useEffect(() => {
        if (!credits || !roles) return;
        setChips(prev => {
            const prevActiveMap = new Map(prev.map(c => [c.name, c.isActive]));

            return [
                { name: "Movies", isActive: prevActiveMap.has("Movies") ? prevActiveMap.get("Movies") : true, count: credits.filter(c => c.media_type === 'movie').length },
                { name: "TV Shows", isActive: prevActiveMap.has("TV Shows") ? prevActiveMap.get("TV Shows") : true, count: credits.filter(c => c.media_type === 'tv').length },
                ...roles.map(r => ({ name: r.role, isActive: prevActiveMap.has(r.role) ? prevActiveMap.get(r.role) : r.role.toLowerCase() !== "self", count: r.count }))
            ];
        });
    }, [roles, credits]);

    const toggleChip = (chipName) => {
        setChips(prev => prev.map(c => c.name === chipName ? { ...c, isActive: !c.isActive } : c));
    };

    const filteredCredits = useMemo(() => {
        if (!person || !credits) return [];
        const activeChipNames = new Set(chips.filter(c => c.isActive).map(c => c.name));

        if (activeChipNames.size === 0) return [];

        return credits.filter(credit => {
            const mediaTypeName = credit.media_type === 'movie' ? 'Movies' : 'TV Shows';
            if (!activeChipNames.has(mediaTypeName)) return false;

            const isSelf = /\b(self|himself|herself)\b/i.test(credit.character || '');
            const creditJobs = credit.isCast
                ? [(isSelf ? "Self" : (person.gender === 1 ? "Actress" : "Actor")), ...(credit.jobs || [])]
                : (credit.jobs || []);

            return creditJobs.some(job => activeChipNames.has(job));
        });
    }, [credits, chips, person]);

    return (
        <div className="flex flex-col gap-6">
            {knownForCredits.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold text-muted mb-2">Known For</h2>
                    <Carousel id="person-known-for" saveScroll={false} paddingClass="px-0 pb-4">
                        {knownForCredits.map(credit => {
                            const compId = `${credit.media_type === 'tv' ? 'show' : 'movie'}_${credit.id}`;

                            return (
                                <div
                                    key={compId}
                                    onClick={() => navigate(`/details/${compId}`)}
                                    className="group flex flex-col gap-1 cursor-pointer w-28 sm:w-32 lg:w-36 xl:w-40 shrink-0 snap-start"
                                >
                                    <div className="relative w-full aspect-2/3 rounded-lg overflow-hidden transition-shadow shadow-sm group-hover:shadow-lg bg-background">
                                        <MediaImage
                                            imagePath={credit.posterPath}
                                            className="w-full h-full"
                                        />

                                        <RingGlow rounded="rounded-lg" hover />
                                    </div>

                                    <p className="text-sm text-center text-muted truncate px-1 group-hover:text-body transition-colors">{credit.character}</p>
                                </div>
                            );
                        })}
                    </Carousel>
                </div>
            )}

            {credits && credits.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold text-muted mb-4">Credits</h2>

                    <div className="flex flex-row flex-wrap gap-2 w-full mb-6">
                        {chips?.map(c => (
                            <div key={`chip_${c.name}`}
                                onClick={() => toggleChip(c.name)}
                                className={`flex items-center gap-2 px-3 py-1 transition-all rounded-full border border-white/10 noselect cursor-pointer shadow-sm hover:shadow-md
                                ${c.isActive ? 'bg-white/20 hover:bg-white/15 text-body' : 'bg-white/5 hover:bg-white/10 text-muted'}`}
                            >
                                <span>{c.name}</span>
                                <span className="text-muted text-xs">{c.count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col pb-8">
                        {filteredCredits.map((credit, i) => {
                            const compId = `${credit.media_type === 'tv' ? 'show' : 'movie'}_${credit.id}`;
                            const role = credit.character || credit.job || (credit.jobs && credit.jobs.join(', ')) || 'Unknown Role';
                            const title = credit.title || credit.name;
                            const year = credit.year || 'Unknown Release Date';
                            const isSelf = /\b(self|himself|herself)\b/i.test(credit.character || '');
                            const jobs = credit.isCast ? [(isSelf ? "Self" : (person.gender === 1 ? "Actress" : "Actor")), ...(credit.jobs || [])] : (credit.jobs || []);

                            return (
                                <div
                                    key={`${compId}-${i}`}
                                    onClick={() => navigate(`/details/${compId}`)}
                                    className="relative h-28 p-1 flex gap-4 items-center overflow-hidden group cursor-pointer rounded-lg"
                                >
                                    <div className="isolate relative h-full aspect-2/3 rounded-sm overflow-hidden bg-background">
                                        <MediaImage imagePath={credit.posterPath} className="h-full" />
                                        
                                        <RingGlow rounded="rounded-sm" />
                                    </div>

                                    <div className="absolute inset-0 overflow-hidden flex items-center pointer-events-none -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-50">
                                        <MediaImage imagePath={credit.posterPath} className="w-full blur-lg mask-[radial-gradient(50vw_circle_at_0%_50%,black,transparent)]" />
                                    </div>

                                    <div className="flex flex-col flex-1">
                                        <span className="text-sm text-muted"> {year} </span>
                                        <span className="font-semibold text-body group-hover:text-body transition-colors">{title}</span>
                                        <span className="text-sm text-muted">
                                            {jobs.map((job, idx) => (
                                                <span key={idx} className="mr-2 border border-white/20 text-[10px] px-1 rounded text-body/50 uppercase">
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

export function DesktopPersonCreditsSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div>
                <h2 className="text-2xl font-semibold text-muted mb-2 opacity-50">Known For</h2>
                <div className="flex gap-4 overflow-hidden pb-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="group flex flex-col gap-1 w-28 sm:w-32 lg:w-36 xl:w-40 shrink-0">
                            <div className="w-full aspect-2/3 bg-white/10 rounded-lg" />
                            <div className="w-3/4 h-3 bg-white/10 rounded mx-auto mt-1" />
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold text-muted mb-4 opacity-50">Credits</h2>
                
                <div className="flex flex-row flex-wrap gap-2 w-full mb-6">
                    <div className="w-20 h-7 bg-white/10 rounded-full" />
                    <div className="w-24 h-7 bg-white/10 rounded-full" />
                    <div className="w-16 h-7 bg-white/10 rounded-full" />
                </div>

                <div className="flex flex-col pb-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="relative h-28 p-1 flex gap-4 items-center rounded-lg">
                            <div className="h-full aspect-2/3 bg-white/10 rounded-sm" />
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="w-12 h-3 bg-white/10 rounded" />
                                <div className="w-48 h-5 bg-white/10 rounded" />
                                <div className="w-32 h-3 bg-white/10 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
