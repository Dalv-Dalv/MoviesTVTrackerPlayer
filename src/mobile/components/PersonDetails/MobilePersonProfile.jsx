import { MediaImage } from "../../../shared/components/MediaImage";
import { ProfileImage } from "../../../shared/components/ProfileImage";
import RingGlow from "../../../shared/components/RingGlow";

export function MobilePersonProfile({ person, age, formattedBirthday, onOpenModal }) {
    return (
        <div className="w-full max-w-64 sm:max-w-72 mx-auto landscape:mx-0 ml:mx-0 z-10 flex flex-col gap-4">
            <div
                onClick={onOpenModal}
                className="isolate relative mx-auto max-h-[90dvh] landscape:mx-0 ml:mx-0 aspect-2/3 rounded-lg overflow-hidden shadow-xl cursor-pointer group bg-background"
            >
                <ProfileImage imagePath={person.profilePathFull} className="w-full h-full rounded-lg" iconSize={52} />

                <RingGlow rounded="rounded-lg" hover />
            </div>

            <div className="relative flex flex-col gap-2 p-3 sm:p-4 py-2.5 sm:py-3 rounded-lg shadow-xl bg-background/50 backdrop-blur-md">
                <h1 className="text-lg sm:text-xl font-bold truncate">{person.name}</h1>

                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 text-xs sm:text-sm">
                    <span className="text-muted text-right">Role</span>
                    <span className="text-body truncate">{person.known_for_department || '-'}</span>

                    <span className="text-muted text-right">Age</span>
                    <span className="text-body">{age}</span>

                    <span className="text-muted text-right">Born</span>
                    <span className="text-body truncate">{formattedBirthday}</span>

                    <span className="text-muted text-right">In</span>
                    <span className="text-body truncate">{person.place_of_birth || '-'}</span>

                    {person.deathday && (
                        <>
                            <span className="text-muted text-right">Died</span>
                            <span className="text-body truncate">{new Date(person.deathday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                        </>
                    )}
                </div>

                <div className="absolute -z-10 inset-0 rounded-lg overflow-hidden mask-[linear-gradient(to_top,rgba(0,0,0,0.2),black)] bg-background">
                    <MediaImage
                        imagePath={person.profilePath}
                        className="relative -top-6 -z-10 w-full pointer-events-none rotate-x-180 blur-md scale-x-110 origin-center opacity-40"
                    />
                    <RingGlow rounded="rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function MobilePersonProfileSkeleton() {
    return (
        <div className="w-full max-w-64 sm:max-w-72 mx-auto landscape:mx-0 ml:mx-0 z-10 flex flex-col gap-4 animate-pulse">
            <div className="isolate relative w-40 sm:w-44 landscape:w-36 ml:w-36 mx-auto landscape:mx-0 ml:mx-0 aspect-2/3 rounded-lg overflow-hidden shadow-xl bg-white/10" />
            <div className="relative flex flex-col gap-2 p-3 sm:p-4 py-2.5 sm:py-3 rounded-lg shadow-xl bg-white/5">
                <div className="w-36 h-5 bg-white/10 rounded-md mb-1" />
                <div className="w-28 h-3.5 bg-white/10 rounded-md" />
                <div className="w-32 h-3.5 bg-white/10 rounded-md" />
                <div className="w-24 h-3.5 bg-white/10 rounded-md" />
            </div>
        </div>
    );
}
