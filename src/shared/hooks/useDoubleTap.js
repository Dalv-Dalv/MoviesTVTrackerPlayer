import { useRef, useCallback } from 'react';

export const useDoubleTap = (onDoubleTap, onSingleTap = null, delay = 300) => {
    const timerRef = useRef(null);

    return useCallback((...args) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
            onDoubleTap(...args);
        } else {
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                if (onSingleTap) onSingleTap(...args);
            }, delay);
        }
    }, [onDoubleTap, onSingleTap, delay]);
};
