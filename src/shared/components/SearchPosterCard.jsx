import { MediaImage } from "./MediaImage";
import { ProfileImage } from "./ProfileImage";
import RingGlow from "./RingGlow";

export function SearchPosterCard({ item, onClick, variant = "desktop", className = "" }) {
    const isPerson = item.media_type === "person";
    const isMobile = variant === "mobile";
    const title = item.name || item.title;
    const widthClass = isMobile ? "w-28" : "w-full";

    if (isPerson) {
        return (
            <div
                onClick={onClick}
                className={`group relative shrink-0 ${widthClass} rounded-lg overflow-hidden select-none cursor-pointer active:scale-[0.97] transition-transform duration-150 ${className}`}
            >
                <div className="relative w-full aspect-2/3 rounded-lg overflow-hidden">
                    <ProfileImage
                        imagePath={item.profile_path}
                        className="w-full aspect-2/3 object-cover bg-surface"
                    />

                    {!isMobile && (
                        <div className="absolute bottom-0 w-full h-9 flex items-center justify-center px-2">
                            <div className="absolute inset-0 backdrop-blur-2xl brightness-70" />
                            <span className="relative z-10 text-sm font-medium text-center text-body line-clamp-2 leading-tight">
                                {title}
                            </span>
                        </div>
                    )}

                    <RingGlow rounded="rounded-lg" includeSolid={false} hover={!isMobile} />
                </div>

                {isMobile && (
                    <div className="w-full h-9 flex items-center justify-center px-1">
                        <span className="text-xs font-medium text-center text-body line-clamp-2 leading-tight">
                            {title}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`group relative shrink-0 ${widthClass} aspect-2/3 rounded-lg overflow-hidden select-none cursor-pointer active:scale-[0.97] transition-transform duration-150 bg-surface ${className}`}
        >
            <MediaImage
                imagePath={item.poster_path}
                className="w-full h-full object-cover"
            />

            <RingGlow rounded="rounded-lg" includeSolid={false} hover={!isMobile} />
        </div>
    );
}

export default SearchPosterCard;