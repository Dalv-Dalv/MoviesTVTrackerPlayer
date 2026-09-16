import { useLocalImage } from '../hooks/useLocalImage';
import { useState, useEffect, useRef } from 'react';

export function MovieImage({ relativePath, imagePath, altText, className = "", lazy = true }) {
    const path = imagePath || relativePath;
    const src = useLocalImage(path);
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        setIsLoaded(false);
    }, [src]);

    useEffect(() => {
        if (imgRef.current && imgRef.current.complete) {
            setIsLoaded(true);
        }
    }, [src]);

    if (!src) {
        return (
            <div className={`bg-neutral-800/50 animate-pulse flex items-center justify-center text-neutral-500 text-sm text-center p-4 ${className}`}>
                {altText}
            </div>  
        );
    }

    const transitionClass = className.includes('transition') ? '' : 'transition-opacity duration-500';

    return <img 
        ref={imgRef}
        src={src} 
        alt={altText} 
        className={`${className.includes('object-') ? '' : 'object-cover object-center'} ${transitionClass} ${className}`} 
        style={{ opacity: isLoaded ? undefined : 0 }}
        loading={lazy ? "lazy" : undefined}
        onLoad={() => setIsLoaded(true)}
    />
}