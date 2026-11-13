import { useState, useEffect } from "react";
import {
    FilmSlateIcon,
    TelevisionIcon,
    UserIcon,
    FolderIcon,
    ImageBrokenIcon
} from "@phosphor-icons/react";
import { MediaImage } from "./MediaImage";
import { ProfileImage } from "./ProfileImage";
import RingGlow from "./RingGlow";

const TYPE_ICONS = {
    movie: FilmSlateIcon,
    tv: TelevisionIcon,
    show: TelevisionIcon,
    person: UserIcon,
    collection: FolderIcon
};

function useImageStatus(src) {
    const [status, setStatus] = useState(() => {
        if (!src) return "empty";
        if (typeof window !== "undefined") {
            const img = new Image();
            img.src = src;
            if (img.complete && img.naturalWidth > 0) return "loaded";
        }
        return "loading";
    });

    useEffect(() => {
        if (!src) {
            setStatus("empty");
            return;
        }

        let cancelled = false;
        const img = new Image();
        img.src = src;

        if (img.complete && img.naturalWidth > 0) {
            setStatus("loaded");
            return;
        }

        setStatus("loading");
        img.onload = () => {
            if (!cancelled) setStatus("loaded");
        };
        img.onerror = () => {
            if (!cancelled) setStatus("error");
        };

        return () => {
            cancelled = true;
        };
    }, [src]);

    return status;
}

export function SearchPosterCard({ item, onClick, variant = "desktop", className = "" }) {
    const isPerson = item.media_type === "person";
    const isMobile = variant === "mobile";
    const title = item.name || item.title || "Untitled";
    const imagePath = isPerson ? item.profile_path : item.poster_path;
    const widthClass = isMobile ? "w-28" : "w-full";

    const status = useImageStatus(imagePath);
    const isMissingImage = status === "empty" || status === "error";
    const isLoadingImage = status === "loading";
    const isLoadedImage = status === "loaded";

    const TypeIcon = TYPE_ICONS[item.media_type] || FilmSlateIcon;

    if (isPerson) {
        return (
            <div
                onClick={onClick}
                className={`group relative shrink-0 ${widthClass} rounded-lg overflow-hidden select-none cursor-pointer active:scale-[0.97] transition-transform duration-150 ${className}`}
            >
                <div className="relative w-full aspect-2/3 rounded-lg overflow-hidden bg-surface">
                    <div className="w-full h-full transition-opacity duration-300">
                        <ProfileImage
                            imagePath={imagePath}
                            className="w-full h-full object-cover bg-white/3"
                            iconSize={86}
                        />
                    </div>

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
            {!isMissingImage && (
                <div className={`w-full h-full transition-opacity duration-300 ${isLoadedImage ? "opacity-100" : "opacity-0"}`}>
                    <MediaImage
                        imagePath={imagePath}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {!isLoadedImage && (
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-between p-3 text-center ${isLoadingImage ? "animate-pulse bg-white/5" : "bg-white/3"
                        }`}
                >
                    <div className="flex flex-col items-center gap-1 my-auto px-1">
                        <TypeIcon size={isMobile ? 20 : 24} className="text-muted/30" />
                        <span className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-body/90 line-clamp-3 leading-snug`}>
                            {title}
                        </span>
                        {item.release_year && (
                            <span className="text-xs text-muted/60">
                                {item.release_year}
                            </span>
                        )}
                    </div>

                    <div className="h-3" />
                </div>
            )}

            <RingGlow rounded="rounded-lg" includeSolid={false} hover={!isMobile} />
        </div>
    );
}

export default SearchPosterCard;