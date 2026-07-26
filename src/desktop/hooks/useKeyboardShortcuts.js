import { useEffect } from "react";
import { VideoPlayer } from "../../shared/VideoEngine";

export function useKeyboardShortcuts({ togglePlay, toggleFullscreen }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;

            switch (e.key) {
                case ' ': e.preventDefault(); togglePlay(); break;
                case 'ArrowRight': VideoPlayer.seek(5); break;
                case 'ArrowLeft': VideoPlayer.seek(-5); break;
                case 'ArrowUp': VideoPlayer.seek(60); break;
                case 'ArrowDown': VideoPlayer.seek(-60); break;
                case 'F':
                case 'f': e.shiftKey ? console.log("TODO: Smaller subs") : toggleFullscreen(); break;
                case 'Escape': toggleFullscreen(false); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, toggleFullscreen]);
}