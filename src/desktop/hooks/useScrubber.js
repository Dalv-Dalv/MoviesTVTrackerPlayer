import { useCallback, useEffect, useRef } from "react";

export function useScrubber({
    orientation = 'horizontal', // 'horizontal' | 'vertical'
    reverse = false,
    onChange
}) {
    const trackRef = useRef(null);
    const isScrubbing = useRef(false);

    const handleScrub = useCallback((e) => {
        if (!trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        let ratio = 0;

        if (orientation === 'horizontal') {
            ratio = (e.clientX - rect.left) / rect.width;
        } else {
            ratio = (rect.bottom - e.clientY) / rect.height;
        }

        if (reverse) ratio = 1 - ratio;

        const clampedRatio = Math.max(0, Math.min(1, ratio));

        if (onChange) {
            onChange(clampedRatio);
        }
    }, [orientation, reverse, onChange]);

    useEffect(() => {
        const onMouseMove = (e) => { if (isScrubbing.current) handleScrub(e); };
        const onMouseUp = () => { isScrubbing.current = false; };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [handleScrub]);

    const onMouseDown = (e) => {
        isScrubbing.current = true;
        handleScrub(e);
    };

    return { trackRef, isScrubbing, onMouseDown };
}