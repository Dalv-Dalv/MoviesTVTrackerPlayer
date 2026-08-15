import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useState } from 'react';

const appWindow = getCurrentWindow();
let wasMaximizedBeforeFullscreen = false;

export function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = useCallback(async (forceState) => {
        const isCurrentlyFullscreen = await appWindow.isFullscreen();
        const newState = forceState === undefined ? !isCurrentlyFullscreen : forceState;

        if (newState === isCurrentlyFullscreen) return;

        if (newState) {
            wasMaximizedBeforeFullscreen = await appWindow.isMaximized();

            if (wasMaximizedBeforeFullscreen) {
                await appWindow.setDecorations(true);
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
            if (wasMaximizedBeforeFullscreen) {
                await appWindow.setDecorations(false);
                await appWindow.maximize();
            }
        }

        setIsFullscreen(newState);
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