import { ExpandableText } from "../../../shared/components/ExpandableText";

export function DesktopPersonBio({ person }) {
    return (
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
    );
}

export function DesktopPersonBioSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="w-40 h-8 bg-white/10 rounded-md mb-2" />
            <div className="w-full h-4 bg-white/10 rounded-md mb-2" />
            <div className="w-full h-4 bg-white/10 rounded-md mb-2" />
            <div className="w-full h-4 bg-white/10 rounded-md mb-2" />
            <div className="w-3/4 h-4 bg-white/10 rounded-md" />
        </div>
    );
}
