import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { MediaImage } from "../../shared/components/MediaImage";
import { ProfilePicturesModal } from "../../shared/components/ProfilePicturesModal";
import { usePersonData } from "../../shared/hooks/usePersonData";
import { useDelayedLoading } from "../../shared/hooks/useDelayedLoading";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { DesktopPersonProfile, DesktopPersonProfileSkeleton } from "./PersonDetails/DesktopPersonProfile";
import { DesktopPersonBio, DesktopPersonBioSkeleton } from "./PersonDetails/DesktopPersonBio";
import { DesktopPersonCredits, DesktopPersonCreditsSkeleton } from "./PersonDetails/DesktopPersonCredits";

export function DesktopPersonDetails({ rawTmdbId }) {
    const navigate = useNavigate();
    const { person, knownForCredits, credits, images, roles, isError, formattedBirthday, age } = usePersonData(rawTmdbId);
    const showPersonSkeleton = useDelayedLoading(!person);
    const showCreditsSkeleton = useDelayedLoading(!credits);

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
    }, [scrollY, rawTmdbId, person]);

    const backdropY = useTransform(scrollY, value => value * -0.5);

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full text-body bg-background">
                <h2 className="text-2xl font-bold mb-4">Person not found!</h2>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-semibold">Go Back</button>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} ref={containerRef} className="w-full text-body pb-12 overflow-x-hidden">
            <ProfilePicturesModal isOpen={isProfilePicturesModalOpen} onClose={() => setIsProfilePicturesModalOpen(false)} pictures={images || []} />

            <div className='fixed inset-0 overflow-hidden pointer-events-none noselect -z-10 bg-background'>
                <motion.div style={{ y: backdropY }} className="relative w-full">
                    {person && (
                        <>
                            <MediaImage
                                imagePath={person.profilePath}
                                className={`w-full h-auto pointer-events-none blur-3xl opacity-30`}
                            />
                            <div className="absolute -inset-32 bg-linear-to-b from-transparent to-background pointer-events-none" />
                        </>
                    )}
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
                    {showPersonSkeleton ? (
                        <DesktopPersonProfileSkeleton />
                    ) : person ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <DesktopPersonProfile person={person} age={age} formattedBirthday={formattedBirthday} onOpenModal={() => setIsProfilePicturesModalOpen(true)} />
                        </motion.div>
                    ) : null}
                </div>

                {/* Right Column: Bio & Known For */}
                <div className="flex flex-col gap-6 w-full min-w-0">
                    {showPersonSkeleton ? (
                        <DesktopPersonBioSkeleton />
                    ) : person ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <DesktopPersonBio person={person} />
                        </motion.div>
                    ) : null}

                    {showCreditsSkeleton ? (
                        <DesktopPersonCreditsSkeleton />
                    ) : credits ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <DesktopPersonCredits person={person} credits={credits} knownForCredits={knownForCredits} roles={roles} />
                        </motion.div>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
}
