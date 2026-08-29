import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { CardsIcon, MinusIcon, SquareIcon, XIcon } from '@phosphor-icons/react';
import { useFullscreen } from '../../shared/hooks/useFullscreen';

export function WindowTitlebar() {
    const [isMaximized, setIsMaximized] = useState(false);
    const { isFullscreen } = useFullscreen();
    const appWindow = getCurrentWindow();

    useEffect(() => {
        let unlisten;
        const checkMaximized = async () => {
            const max = await appWindow.isMaximized();
            setIsMaximized(max);
        };

        checkMaximized();

        const listenToResize = async () => {
            unlisten = await appWindow.onResized(() => {
                checkMaximized();
            });
        };

        listenToResize();

        return () => {
            if (unlisten) {
                unlisten();
            }
        };
    }, []);

    return (
        <div
            data-tauri-drag-region
            className="h-5 select-none flex justify-end items-center fixed top-0 left-0 right-0 z-100 overflow-hidden bg-transparent"
        >
            <div className="flex h-full pointer-events-auto text-white/0">
                <button
                    className="h-full px-4 hover:bg-linear-to-b from-divider/50 to-transparent hover:text-white transition-colors duration-300 inline-flex justify-center items-center"
                    onClick={() => appWindow.minimize()}
                    title="Minimize"
                >
                    <MinusIcon size={16} />
                </button>
                <button
                    className="h-full px-4 hover:bg-linear-to-b from-divider/50 to-transparent hover:text-white transition-colors duration-300 inline-flex justify-center items-center"
                    onClick={() => appWindow.toggleMaximize()}
                    title={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? (
                        <CardsIcon size={16} />
                    ) : (
                        <SquareIcon size={16} />
                    )}
                </button>
                <button
                    className="h-full px-4 hover:bg-linear-to-b from-red-500/50 to-transparent hover:text-white transition-colors duration-300 inline-flex justify-center items-center"
                    onClick={() => appWindow.close()}
                    title="Close"
                >
                    <XIcon size={16} weight='bold' />
                </button>
            </div>
        </div>
    );
}
