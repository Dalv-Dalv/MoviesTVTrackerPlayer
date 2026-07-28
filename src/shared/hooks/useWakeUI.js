import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "../SettingsContext";

export function useWakeUI({holdOpen = false}) {
    const { settings } = useSettings();
    const [showControls, setShowControls] = useState(true);
    const timeoutRef = useRef(null);
    const isHoveringInteractiveRef = useRef(false);

    const wakeUI = useCallback(() => {
        setShowControls(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            if (!isHoveringInteractiveRef.current && !holdOpen) setShowControls(false);
        }, settings.wakeUITimeout);
    }, [settings.wakeUITimeout, holdOpen]);

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