import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useState } from 'react';

const appWindow = getCurrentWindow();

export function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = useCallback(async (forceState) => {
        const newState = forceState === undefined ? !(await appWindow.isFullscreen()) : forceState;
        await appWindow.setFullscreen(newState);
        setIsFullscreen(newState);
    }, [appWindow]);

    useEffect(() => {
        let unlistenResize;
        const setup = async () => {
            unlistenResize = await appWindow.onResized(async () => {
                const isNowFullscreen = await appWindow.isFullscreen();
                setIsFullscreen(prev => prev !== isNowFullscreen ? isNowFullscreen : prev);
            });
        };
        setup();
        return () => unlistenResize && unlistenResize();
    }, [appWindow]);

    return { isFullscreen, toggleFullscreen };
}