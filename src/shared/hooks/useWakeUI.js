import { useCallback, useEffect, useRef, useState } from "react";

export function useWakeUI(timeoutMs = 1000) {
    const [showControls, setShowControls] = useState(true);
    const timeoutRef = useRef(null);
    const isHoveringInteractiveRef = useRef(false);

    const wakeUI = useCallback(() => {
        setShowControls(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            if (!isHoveringInteractiveRef.current) setShowControls(false);
        }, timeoutMs);
    }, [timeoutMs]);

    useEffect(() => {
        wakeUI();
        return () => clearTimeout(timeoutRef.current);
    }, [wakeUI]);

    const handleInteractiveEnter = () => { isHoveringInteractiveRef.current = true; };
    const handleInteractiveLeave = () => {
        isHoveringInteractiveRef.current = false;
        wakeUI();
    };

    return { showControls, wakeUI, handleInteractiveEnter, handleInteractiveLeave };
}