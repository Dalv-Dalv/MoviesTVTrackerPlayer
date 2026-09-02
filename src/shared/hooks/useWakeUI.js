import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from '../contexts/SettingsContext';

export function useWakeUI({holdOpen = false}) {
    const { settings } = useSettings();
    const [showControls, setShowControls] = useState(true);
    const showControlsRef = useRef(true);
    const timeoutRef = useRef(null);
    const isHoveringInteractiveRef = useRef(false);

    const wakeUI = useCallback(() => {
        setShowControls(true);
        showControlsRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            if (!isHoveringInteractiveRef.current && !holdOpen) {
                setShowControls(false);
                showControlsRef.current = false;
            }
        }, settings.wakeUITimeout);
    }, [settings.wakeUITimeout, holdOpen]);

    const hideUI = useCallback(() => {
        setShowControls(false);
        showControlsRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const toggleUI = useCallback(() => {
        if (showControlsRef.current) {
            hideUI();
        } else {
            wakeUI();
        }
    }, [hideUI, wakeUI]);

    const resetUITimerIfVisible = useCallback(() => {
        if (showControlsRef.current) {
            wakeUI();
        }
    }, [wakeUI]);

    useEffect(() => {
        wakeUI();
        return () => clearTimeout(timeoutRef.current);
    }, [wakeUI]);

    const handleInteractiveEnter = () => { isHoveringInteractiveRef.current = true; };
    const handleInteractiveLeave = () => {
        isHoveringInteractiveRef.current = false;
        wakeUI();
    };

    return { showControls, wakeUI, hideUI, toggleUI, resetUITimerIfVisible, handleInteractiveEnter, handleInteractiveLeave };
}