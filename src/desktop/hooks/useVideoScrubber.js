import { useCallback, useEffect, useRef } from "react";
import { VideoPlayer } from "../../shared/VideoEngine";

export function useVideoScrubber(duration, setCurrentTime) {
    const progressBarRef = useRef(null);
    const isScrubbing = useRef(false);

    const handleScrub = useCallback((e) => {
        if (!progressBarRef.current || duration === 0) return;
        
        const rect = progressBarRef.current.getBoundingClientRect();
        const rawPercent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 100.0;
        const safePercent = rawPercent.toFixed(3);
        const newTime = (rawPercent / 100) * duration;

        setCurrentTime(newTime);
        VideoPlayer.seekToPercentage(safePercent);
    }, [duration, setCurrentTime]);

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

    return { progressBarRef, isScrubbing, handleScrub };
}