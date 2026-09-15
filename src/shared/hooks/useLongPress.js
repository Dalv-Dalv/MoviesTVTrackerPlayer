import { useCallback, useRef } from 'react';

export const useLongPress = (onLongPress, { delay = 500 } = {}) => {
    const timeout = useRef(null);

    const start = useCallback(
        (e) => {
            if (e.type === 'mousedown' && e.button !== 0) return;
            timeout.current = setTimeout(() => {
                onLongPress(e);
                timeout.current = null;
            }, delay);
        },
        [onLongPress, delay]
    );

    const clear = useCallback(() => {
        if (timeout.current) {
            clearTimeout(timeout.current);
            timeout.current = null;
        }
    }, []);

    return useCallback(() => {
        return {
            onMouseDown: start,
            onTouchStart: start,
            onMouseUp: clear,
            onMouseLeave: clear,
            onTouchEnd: clear,
            onTouchCancel: clear,
            onTouchMove: clear,
        };
    }, [start, clear]);
};
