import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { usePersonData } from "../../shared/hooks/usePersonData";
import { useDelayedLoading } from "../../shared/hooks/useDelayedLoading";
import { motion } from "framer-motion";
import { MobilePersonProfile, MobilePersonProfileSkeleton } from "./PersonDetails/MobilePersonProfile";
import { MobilePersonBio, MobilePersonBioSkeleton } from "./PersonDetails/MobilePersonBio";
import { MobilePersonCredits, MobilePersonCreditsSkeleton } from "./PersonDetails/MobilePersonCredits";

export function MobilePersonDetails({ rawTmdbId }) {
    const navigate = useNavigate();
    const { person, knownForCredits, credits, isError, formattedBirthday, age } = usePersonData(rawTmdbId);
    const showPersonSkeleton = useDelayedLoading(!person);
    const showCreditsSkeleton = useDelayedLoading(!credits);

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full text-white bg-background">
                <h2 className="text-2xl font-bold mb-4">Person not found!</h2>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-semibold">Go Back</button>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="w-full min-h-screen bg-background text-white overflow-y-auto pb-32">
            {/* Header/Back Button */}
            <div className="sticky top-0 z-50 p-4 bg-background/80 backdrop-blur-md flex items-center gap-4 border-b border-white/5">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeftIcon size={24} weight="bold" />
                </button>
                {showPersonSkeleton ? (
                    <div className="w-48 h-6 bg-white/10 rounded-md animate-pulse" />
                ) : person ? (
                    <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="text-xl font-semibold tracking-wide truncate">
                        {person.name}
                    </motion.h1>
                ) : null}
            </div>

            <div className="p-4 flex flex-col gap-8 items-start">
                {/* Photo & Info */}
                {showPersonSkeleton ? (
                    <MobilePersonProfileSkeleton />
                ) : person ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="w-full">
                        <MobilePersonProfile person={person} age={age} formattedBirthday={formattedBirthday} />
                    </motion.div>
                ) : null}

                {/* Bio & Known For */}
                <div className="flex-1 flex flex-col gap-8 w-full min-w-0">
                    {showPersonSkeleton ? (
                        <MobilePersonBioSkeleton />
                    ) : person ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <MobilePersonBio person={person} />
                        </motion.div>
                    ) : null}

                    {showCreditsSkeleton ? (
                        <MobilePersonCreditsSkeleton />
                    ) : credits ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">
                            <MobilePersonCredits person={person} credits={credits} knownForCredits={knownForCredits} />
                        </motion.div>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
}
