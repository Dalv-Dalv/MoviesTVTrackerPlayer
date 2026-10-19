import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { MediaImage } from "../../shared/components/MediaImage";
import { ProfilePicturesModal } from "../../shared/components/ProfilePicturesModal";
import { usePersonData } from "../../shared/hooks/usePersonData";
import { useDelayedLoading } from "../../shared/hooks/useDelayedLoading";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { MobilePersonProfile, MobilePersonProfileSkeleton } from "./PersonDetails/MobilePersonProfile";
import { MobilePersonBio, MobilePersonBioSkeleton } from "./PersonDetails/MobilePersonBio";
import { MobilePersonKnownFor, MobilePersonKnownForSkeleton } from "./PersonDetails/MobilePersonKnownFor";
import { MobilePersonCredits, MobilePersonCreditsSkeleton } from "./PersonDetails/MobilePersonCredits";

export function MobilePersonDetails({ rawTmdbId }) {
    const navigate = useNavigate();
    const { person, knownForCredits, credits, images, roles, isError, formattedBirthday, age } = usePersonData(rawTmdbId);
    const showPersonSkeleton = useDelayedLoading(!person);
    const showCreditsSkeleton = useDelayedLoading(!credits);

    const [isProfilePicturesModalOpen, setIsProfilePicturesModalOpen] = useState(false);

    const containerRef = useRef(null);
    const scrollY = useMotionValue(0);

    useEffect(() => {
        const scrollContainer = containerRef.current?.closest('.overflow-y-auto');

        const handleScroll = (e) => {
            const currentTop = e?.detail?.scrollTop ?? scrollContainer?.scrollTop ?? 0;
            scrollY.set(currentTop);
        };

        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
            handleScroll();
        }

        window.addEventListener('page-scroll', handleScroll, { passive: true });

        return () => {
            scrollContainer?.removeEventListener('scroll', handleScroll);
            window.removeEventListener('page-scroll', handleScroll);
        };
    }, [scrollY, rawTmdbId, person]);

    const backdropY = useTransform(scrollY, value => value * 0.8);

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full text-body bg-background">
                <h2 className="text-2xl font-bold mb-4">Person not found!</h2>
                <button onClick={() => navigate?.(-1)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-semibold">Go Back</button>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} ref={containerRef} className="w-full relative text-body min-h-screen pb-12 overflow-x-hidden">
            <ProfilePicturesModal isOpen={isProfilePicturesModalOpen} onClose={() => setIsProfilePicturesModalOpen(false)} pictures={images || []} />

            {/* Parallax ambient background */}
            <div className='absolute top-0 inset-x-0 pointer-events-none noselect -z-10'>
                <motion.div style={{ y: backdropY }} className="relative w-full">
                    {person && (person.profilePathFull || person.profilePath) && (
                        <>
                            <MediaImage
                                imagePath={person.profilePathFull || person.profilePath}
                                className="w-full h-full object-cover object-top pointer-events-none blur-3xl opacity-80 scale-125"
                            />
                            <div className="absolute -inset-64 bg-linear-to-b from-black/20 via-background/60 to-background pointer-events-none" />
                        </>
                    )}
                </motion.div>
            </div>

            {/* Back button */}
            <button
                onClick={() => navigate?.(-1)}
                className="fixed top-10 left-4 z-60 text-white/80 aspect-square flex items-center justify-center gap-1 hover:text-body transition-colors bg-black/10 active:bg-black/0 rounded-full px-3 py-2 noselect backdrop-blur-md"
            >
                <ArrowLeftIcon size={25} weight='bold' />
            </button>

            {/* Top Section: Stacks in portrait; 2 columns aligned to bottom of screen in landscape */}
            <div className="w-full relative flex flex-col landscape:grid landscape:grid-cols-[auto_1fr] ml:grid ml:grid-cols-[auto_1fr] gap-8 landscape:gap-10 ml:gap-10 landscape:min-h-screen ml:min-h-screen pt-24 landscape:pt-16 ml:pt-16 px-4 sm:px-6 landscape:px-10 ml:px-10">
                {/* Column 1: Profile picture & info card */}
                <div className="w-full landscape:w-auto ml:w-auto flex flex-col landscape:justify-end ml:justify-end landscape:pb-12 ml:pb-12 noselect">
                    {showPersonSkeleton ? (
                        <MobilePersonProfileSkeleton />
                    ) : person ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <MobilePersonProfile person={person} age={age} formattedBirthday={formattedBirthday} onOpenModal={() => setIsProfilePicturesModalOpen(true)} />
                        </motion.div>
                    ) : null}
                </div>

                {/* Column 2: Biography & Known For section (aligned to bottom in landscape) */}
                <div className="flex flex-col gap-6 w-full min-w-0 landscape:justify-end ml:justify-end landscape:pb-12 ml:pb-12">
                    {showPersonSkeleton ? (
                        <MobilePersonBioSkeleton />
                    ) : person ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <MobilePersonBio person={person} />
                        </motion.div>
                    ) : null}

                    {showCreditsSkeleton ? (
                        <MobilePersonKnownForSkeleton />
                    ) : knownForCredits ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <MobilePersonKnownFor knownForCredits={knownForCredits} />
                        </motion.div>
                    ) : null}
                </div>
            </div>

            {/* Credits Section: spans across both columns underneath */}
            <div className="w-full px-4 sm:px-6 landscape:px-10 ml:px-10 pt-4 landscape:pt-8 ml:pt-8 pb-32">
                {showCreditsSkeleton ? (
                    <MobilePersonCreditsSkeleton />
                ) : credits ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <MobilePersonCredits person={person} credits={credits} roles={roles} />
                    </motion.div>
                ) : null}
            </div>
        </motion.div>
    );
}
