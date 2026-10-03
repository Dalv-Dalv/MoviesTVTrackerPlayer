import { UserIcon } from "@phosphor-icons/react";
import { MediaImage } from "./MediaImage";

export function ProfileImage({ imagePath, className = '', iconSize = 48, iconClassName = "text-white/20" }) {
    return (
        <div className={`relative overflow-hidden bg-background ${className}`}>
            {imagePath ? (
                <MediaImage imagePath={imagePath} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <UserIcon size={iconSize} weight="fill" className={iconClassName} />
                </div>
            )}
        </div>
    );
}

