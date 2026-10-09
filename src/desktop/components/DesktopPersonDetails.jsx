import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { ExpandableText } from "../../shared/components/ExpandableText";
import { MediaImage } from "../../shared/components/MediaImage";
import { ProfileImage } from "../../shared/components/ProfileImage";
import { Carousel } from "../../shared/components/Carousel";
import { ProfilePicturesModal } from "../../shared/components/ProfilePicturesModal";
import RingGlow from "../../shared/components/RingGlow";
import { usePersonData } from "../../shared/hooks/usePersonData";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef, useEffect, useState, useMemo } from "react";

export function DesktopPersonDetails({ rawTmdbId }) {
    const navigate = useNavigate();
    const { person, knownForCredits, credits, images, roles, isLoading, formattedBirthday, age } = usePersonData(rawTmdbId);

    const [isProfilePicturesModalOpen, setIsProfilePicturesModalOpen] = useState(false);

    const containerRef = useRef(null);
    const scrollY = useMotionValue(0);

    useEffect(() => {
        const scrollContainer = containerRef.current?.closest('.overflow-y-auto');
        if (!scrollContainer) return;

        const handleScroll = () => {
            scrollY.set(scrollContainer.scrollTop);
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [scrollY, rawTmdbId, isLoading]);

    const [chips, setChips] = useState([{ name: "Movies", isActive: true, count: undefined }, { name: "TV Shows", isActive: true, count: undefined }]);
    useEffect(() => {
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
        if (!person) return [];
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

    const backdropY = useTransform(scrollY, value => value * -0.5);

    console.log(person);
    console.log(knownForCredits);
    console.log(credits);
    console.log(chips);
    console.log(images);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full text-body bg-background">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                <h2 className="text-xl font-medium">Loading details...</h2>
            </div>
        );
    }

    if (!person) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full text-body bg-background">
                <h2 className="text-2xl font-bold mb-4">Person not found!</h2>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-semibold">Go Back</button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full text-body pb-12">
            <ProfilePicturesModal isOpen={isProfilePicturesModalOpen} onClose={() => setIsProfilePicturesModalOpen(false)} pictures={images} />

            <div className='fixed inset-0 overflow-hidden pointer-events-none noselect -z-10 bg-background'>
                <motion.div style={{ y: backdropY }} className="relative w-full">
                    <MediaImage
                        imagePath={person.profilePath}
                        className={`w-full h-auto pointer-events-none blur-3xl opacity-30`}
                    />
                    <div className="absolute -inset-32 bg-linear-to-b from-transparent to-background pointer-events-none" />
                </motion.div>
            </div>

            {/* Top buttons */}
            <div className='fixed top-6 inset-x-6 z-50 flex items-center justify-between gap-2 pointer-events-none'>
                <button
                    onClick={() => navigate(-1)}
                    className="text-body/80 aspect-square flex items-center justify-center gap-1 hover:text-body transition-colors bg-black/10 hover:bg-black/50 active:bg-black/70 rounded-full px-3 py-2 noselect pointer-events-auto"
                >
                    <ArrowLeftIcon size={25} weight='bold' />
                </button>
            </div>

            <div className="w-full relative grid grid-cols-[min(33vw,20rem)_minmax(0,1fr)] gap-12 pt-24 pr-12 pb-32">
                {/* Left Column: Photo & Info */}
                <div className="w-full h-full relative pl-12 noselect">
                    <div className="w-full max-w-80 z-10 sticky top-24 flex flex-col gap-6">
                        <div onClick={() => setIsProfilePicturesModalOpen(true)} className="isolate relative w-full aspect-2/3 rounded-lg overflow-hidden shadow-xl cursor-pointer group">
                            <ProfileImage imagePath={person.profilePathFull} className="w-full h-full rounded-lg" iconSize={64} />

                            <RingGlow rounded="rounded-lg" hover />
                        </div>

                        <div className="relative flex flex-col gap-2 p-4 py-3 rounded-lg shadow-xl">
                            <h1 className="text-xl font-bold">{person.name}</h1>

                            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 text-sm">
                                <span className="text-muted text-right">Role</span>
                                <span className="text-body">{person.known_for_department || '-'}</span>

                                <span className="text-muted text-right">Age</span>
                                <span className="text-body">{age}</span>

                                <span className="text-muted text-right">Born</span>
                                <span className="text-body">{formattedBirthday}</span>

                                <span className="text-muted text-right">In</span>
                                <span className="text-body">{person.place_of_birth || '-'}</span>

                                {person.deathday && (
                                    <>
                                        <span className="text-muted">Died</span>
                                        <span className="text-body">{new Date(person.deathday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                                    </>
                                )}
                            </div>

                            <div className="absolute -z-10 inset-0 rounded-lg overflow-hidden mask-[linear-gradient(to_top,rgba(0,0,0,0.2),black)] bg-background">
                                <MediaImage
                                    imagePath={person.profilePath}
                                    className={`relative -top-6 -z-10 w-full pointer-events-none rotate-x-180 blur-md scale-x-110 origin-center opacity-40`}
                                />
                                <RingGlow rounded="rounded-lg" />
                            </div>

                        </div>
                    </div>
                </div>

                {/* Right Column: Bio & Known For */}
                <div className="flex flex-col gap-6 pb-4000 w-full min-w-0">
                    <div>
                        <h2 className="text-2xl font-semibold text-muted mb-2">Biography</h2>
                        {person.biography ? (
                            <div className="text-body/90 text-lg leading-relaxed">
                                <ExpandableText text={person.biography} maxLength={600} />
                            </div>
                        ) : (
                            <p className="text-muted italic">We don't have a biography for {person.name}.</p>
                        )}
                    </div>

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
                                            <div className="relative w-full aspect-2/3 rounded-lg overflow-hidden transition-shadow shadow-sm group-hover:shadow-lg">
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
                                            <div className="isolate relative h-full aspect-2/3 rounded-sm overflow-hidden">
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
            </div>
        </div>
    );
}
