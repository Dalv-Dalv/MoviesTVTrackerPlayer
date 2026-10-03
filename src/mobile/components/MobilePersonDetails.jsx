import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { ExpandableText } from "../../shared/components/ExpandableText";
import { MediaImage } from "../../shared/components/MediaImage";
import { ProfileImage } from "../../shared/components/ProfileImage";
import { Carousel } from "../../shared/components/Carousel";
import { usePersonData } from "../../shared/hooks/usePersonData";

export function MobilePersonDetails({ rawTmdbId }) {
    const navigate = useNavigate();
    const { person, knownForCredits, credits, isLoading, formattedBirthday, age } = usePersonData(rawTmdbId);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full text-white bg-background">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                <h2 className="text-xl font-medium">Loading details...</h2>
            </div>
        );
    }

    if (!person) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full text-white bg-background">
                <h2 className="text-2xl font-bold mb-4">Person not found!</h2>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-semibold">Go Back</button>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-background text-white overflow-y-auto pb-32">
            {/* Header/Back Button */}
            <div className="sticky top-0 z-50 p-4 bg-background/80 backdrop-blur-md flex items-center gap-4 border-b border-white/5">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeftIcon size={24} weight="bold" />
                </button>
                <h1 className="text-xl font-semibold tracking-wide truncate">{person.name}</h1>
            </div>

            <div className="p-4 flex flex-col gap-8 items-start">
                {/* Photo & Info */}
                <div className="w-full flex flex-col gap-6">
                    <div className="w-full sm:w-72 aspect-[2/3] mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                        <ProfileImage imagePath={person.profilePath} className="w-full h-full rounded-2xl" iconSize={64} />
                    </div>

                    <div className="flex flex-col gap-4 bg-white/5 p-6 rounded-2xl ring-1 ring-white/10 w-full">
                        <h2 className="text-lg font-semibold border-b border-white/10 pb-2">Personal Info</h2>

                        <div>
                            <p className="text-sm text-muted font-medium mb-1">Role</p>
                            <p className="text-body">{person.known_for_department || '-'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted font-medium mb-1">Gender</p>
                            <p className="text-body">{person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : '-'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted font-medium mb-1">Birthday</p>
                            <p className="text-body">{formattedBirthday}{age !== null ? ` (${age} years old)` : ''}</p>
                        </div>
                        
                        {person.deathday && (
                            <div>
                                <p className="text-sm text-muted font-medium mb-1">Day of Death</p>
                                <p className="text-body">
                                    {new Date(person.deathday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                </p>
                            </div>
                        )}

                        {person.place_of_birth && (
                            <div>
                                <p className="text-sm text-muted font-medium mb-1">Place of Birth</p>
                                <p className="text-body">{person.place_of_birth}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bio & Known For */}
                <div className="flex-1 flex flex-col gap-8 w-full min-w-0">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Biography</h2>
                        {person.biography ? (
                            <div className="text-body/90 text-lg leading-relaxed">
                                <ExpandableText text={person.biography} maxLength={400} />
                            </div>
                        ) : (
                            <p className="text-muted italic">We don't have a biography for {person.name}.</p>
                        )}
                    </div>

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
            </div>
        </div>
    );
}
