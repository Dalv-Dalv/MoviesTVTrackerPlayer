import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useState } from 'react';
import { isMobile } from '../utils/PlatformUtils';

const appWindow = getCurrentWindow();
let wasMaximizedBeforeFullscreen = false;

export function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = useCallback(async (forceState) => {
        try {
            const isCurrentlyFullscreen = await appWindow.isFullscreen();
            const newState = forceState === undefined ? !isCurrentlyFullscreen : forceState;

            if (newState === isCurrentlyFullscreen) return;

            if (newState) {
                if (!isMobile) {
                    try {
                        wasMaximizedBeforeFullscreen = await appWindow.isMaximized();
                        if (wasMaximizedBeforeFullscreen) {
                            await appWindow.setDecorations(true);
                        }
                    } catch (e) { console.warn("isMaximized not supported", e); }
                }

                try {
                    await document.documentElement.requestFullscreen();
                } catch (e) {
                    console.warn(e);
                }
                await appWindow.setFullscreen(true);
            } else {
                try {
                    if (document.fullscreenElement) {
                        await document.exitFullscreen();
                    }
                } catch (e) {
                    console.warn(e);
                }
                await appWindow.setFullscreen(false);
                
                if (!isMobile && wasMaximizedBeforeFullscreen) {
                    try {
                        await appWindow.setDecorations(false);
                        await appWindow.maximize();
                    } catch (e) { console.warn("maximize not supported", e); }
                }
            }

            setIsFullscreen(newState);
        } catch (e) {
            console.error("Failed to toggle fullscreen", e);
        }
    }, []);

    useEffect(() => {
        let unlistenPromise = appWindow.onResized(async () => {
            const isNowFullscreen = await appWindow.isFullscreen();
            setIsFullscreen(prev => prev !== isNowFullscreen ? isNowFullscreen : prev);
        });

        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, []);

    return { isFullscreen, toggleFullscreen };
}