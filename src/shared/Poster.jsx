import { useLocalImage } from "./hooks/useLocalImage";

export function MovieImage({ relativePath, altText, className = "" }) {
    const src = useLocalImage(relativePath);

    if (!src) {
        return (
            <div className={`bg-neutral-800 animate-pulse flex items-center justify-center text-neutral-500 text-sm text-center p-4 ${className}`}>
                {altText}
            </div>  
        );
    }

    return <img 
        src={src} 
        alt={altText} 
        className={`object-cover object-center ${className}`} 
        loading="lazy"
    />
}