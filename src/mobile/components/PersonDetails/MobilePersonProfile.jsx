import { ProfileImage } from "../../../shared/components/ProfileImage";

export function MobilePersonProfile({ person, age, formattedBirthday }) {
    return (
        <div className="w-full flex flex-col gap-6">
            <div className="w-full sm:w-72 aspect-[2/3] mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-white/5">
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
    );
}

export function MobilePersonProfileSkeleton() {
    return (
        <div className="w-full flex flex-col gap-6 animate-pulse">
            <div className="w-full sm:w-72 aspect-[2/3] mx-auto rounded-2xl bg-white/10" />
            <div className="flex flex-col gap-4 bg-white/5 p-6 rounded-2xl w-full">
                <div className="w-32 h-6 bg-white/10 rounded-md mb-2" />
                <div className="w-24 h-4 bg-white/10 rounded-md" />
                <div className="w-40 h-4 bg-white/10 rounded-md" />
                <div className="w-32 h-4 bg-white/10 rounded-md" />
            </div>
        </div>
    );
}
