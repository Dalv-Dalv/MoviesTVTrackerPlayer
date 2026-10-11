import { MediaImage } from "../../../shared/components/MediaImage";
import { ProfileImage } from "../../../shared/components/ProfileImage";
import RingGlow from "../../../shared/components/RingGlow";

export function DesktopPersonProfile({ person, age, formattedBirthday, onOpenModal }) {
    return (
        <div className="w-full max-w-80 z-10 sticky top-24 flex flex-col gap-6">
            <div onClick={onOpenModal} className="isolate relative w-full aspect-2/3 rounded-lg overflow-hidden shadow-xl cursor-pointer group bg-background">
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
                            <span className="text-muted text-right">Died</span>
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
    );
}

export function DesktopPersonProfileSkeleton() {
    return (
        <div className="w-full max-w-80 z-10 sticky top-24 flex flex-col gap-6 animate-pulse">
            <div className="isolate relative w-full aspect-2/3 rounded-lg overflow-hidden shadow-xl bg-white/10" />
            <div className="relative flex flex-col gap-2 p-4 py-3 rounded-lg shadow-xl bg-white/5">
                <div className="w-48 h-6 bg-white/10 rounded-md mb-2" />
                <div className="w-32 h-4 bg-white/10 rounded-md" />
                <div className="w-40 h-4 bg-white/10 rounded-md" />
                <div className="w-24 h-4 bg-white/10 rounded-md" />
            </div>
        </div>
    );
}
