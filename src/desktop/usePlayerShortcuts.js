import { useEffect } from 'react';
import { VideoPlayer } from '../shared/VideoEngine';

export function usePlayerShortcuts() {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    VideoPlayer.playPause();
                    break;

                case 'ArrowRight':
                    VideoPlayer.seek(10);
                    break;

                case 'ArrowLeft':
                    VideoPlayer.seek(-10);
                    break;

                case 'F':
                case 'f':
                    if (e.shiftKey) {
                        console.log("TODO: Make subtitles smaller");
                    } else {
                        console.log("TODO: Toggle Fullscreen");
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
}