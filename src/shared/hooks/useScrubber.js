import { useCallback, useEffect, useRef, useState } from "react";

export function useScrubber({
    orientation = 'horizontal', // 'horizontal' | 'vertical'
    reverse = false,
    onChange,
    onScrubEnd
}) {
    const trackRef = useRef(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const isScrubbingRef = useRef(false);
    const lastRatioRef = useRef(0);

    const handleScrub = useCallback((e) => {
        if (!trackRef.current) return;

        const clientX = e.clientX;
        const clientY = e.clientY;

        const rect = trackRef.current.getBoundingClientRect();
        let ratio = 0;

        if (orientation === 'horizontal') {
            ratio = (clientX - rect.left) / rect.width;
        } else {
            ratio = (rect.bottom - clientY) / rect.height;
        }

        if (reverse) ratio = 1 - ratio;

        const clampedRatio = Math.max(0, Math.min(1, ratio));
        lastRatioRef.current = clampedRatio;

        if (onChange) {
            onChange(clampedRatio);
        }
    }, [orientation, reverse, onChange]);

    useEffect(() => {
        const onMouseMove = (e) => { if (isScrubbingRef.current) handleScrub(e); };
        const onTouchMove = (e) => { if (isScrubbingRef.current) handleScrub(e.touches[0]); };
        const onMouseUp = () => { 
            if (isScrubbingRef.current && onScrubEnd) {
                onScrubEnd(lastRatioRef.current);
            }
            isScrubbingRef.current = false; 
            setIsScrubbing(false);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onMouseUp);
        };
    }, [handleScrub, onScrubEnd]);

    const onMouseDown = (e) => {
        isScrubbingRef.current = true;
        setIsScrubbing(true);
        handleScrub(e.touches ? e.touches[0] : e);
    };

    return { trackRef, isScrubbing, onMouseDown, onTouchStart: onMouseDown };
}