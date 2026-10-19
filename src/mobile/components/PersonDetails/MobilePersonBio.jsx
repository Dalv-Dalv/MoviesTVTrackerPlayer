import { ExpandableText } from "../../../shared/components/ExpandableText";

export function MobilePersonBio({ person }) {
    return (
        <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-muted mb-2">Biography</h2>
            {person.biography ? (
                <div className="text-body/90 text-sm sm:text-base leading-relaxed">
                    <ExpandableText text={person.biography} maxLength={400} />
                </div>
            ) : (
                <p className="text-muted italic text-sm">We don't have a biography for {person.name}.</p>
            )}
        </div>
    );
}

export function MobilePersonBioSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="w-36 h-7 bg-white/10 rounded-md mb-2" />
            <div className="w-full h-3.5 bg-white/10 rounded-md mb-2" />
            <div className="w-full h-3.5 bg-white/10 rounded-md mb-2" />
            <div className="w-3/4 h-3.5 bg-white/10 rounded-md" />
        </div>
    );
}
