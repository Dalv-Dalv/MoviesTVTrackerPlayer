import { useState, useEffect, useRef } from 'react';

export function useDelayedLoading(isLoading, delay = 300, minDuration = 100) {
    const [showSkeleton, setShowSkeleton] = useState(false);
    const shownAtRef = useRef(null);
    const delayTimerRef = useRef(null);
    const minDurationTimerRef = useRef(null);

    useEffect(() => {
        if (isLoading) {
            if (minDurationTimerRef.current) {
                clearTimeout(minDurationTimerRef.current);
                minDurationTimerRef.current = null;
            }

            if (showSkeleton) return;

            if (!delayTimerRef.current) {
                delayTimerRef.current = setTimeout(() => {
                    shownAtRef.current = Date.now();
                    setShowSkeleton(true);
                    delayTimerRef.current = null;
                }, delay);
            }
        } else {
            if (delayTimerRef.current) {
                clearTimeout(delayTimerRef.current);
                delayTimerRef.current = null;
            }
            if (showSkeleton) {
                const elapsed = Date.now() - (shownAtRef.current || 0);
                const remaining = Math.max(0, minDuration - elapsed);

                if (remaining === 0) {
                    setShowSkeleton(false);
                    shownAtRef.current = null;
                } else if (!minDurationTimerRef.current) {
                    minDurationTimerRef.current = setTimeout(() => {
                        setShowSkeleton(false);
                        shownAtRef.current = null;
                        minDurationTimerRef.current = null;
                    }, remaining);
                }
            }
        }

        return () => {
            if (delayTimerRef.current) {
                clearTimeout(delayTimerRef.current);
                delayTimerRef.current = null;
            }
            if (minDurationTimerRef.current) {
                clearTimeout(minDurationTimerRef.current);
                minDurationTimerRef.current = null;
            }
        };
    }, [isLoading, delay, minDuration, showSkeleton]);

    return showSkeleton;
}
