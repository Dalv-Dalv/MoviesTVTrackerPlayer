import { useState, useEffect } from 'react';
import YouTube from 'react-youtube';

export function CustomTrailerPlayer({ trailerKey, onReadyToPlay, isPaused, className = '' }) {
    const [player, setPlayer] = useState(null);

    const opts = {
        width: '100%',
        height: '100%',
        playerVars: {
            autoplay: 1,
            controls: 1, // Enable YouTube UI
            modestbranding: 1,
            rel: 0,
            fs: 0,
            iv_load_policy: 3,
            playsinline: 1,
            mute: 0, // Start muted for autoplay to work on mobile
            cc_load_policy: 0, // Disable subtitles
        },
    };

    const onReady = (event) => {
        setPlayer(event.target);
        event.target.setPlaybackQuality('hd1080');
        // Unload closed captions to strictly disable them
        event.target.unloadModule('captions');
        event.target.unloadModule('cc');
        
        event.target.playVideo();
    };

    const onStateChange = (event) => {
        // If it's playing, we should also probably signal ready just in case
        if (event.data === YouTube.PlayerState.PLAYING) {
            if (onReadyToPlay) onReadyToPlay();
        }
    };

    useEffect(() => {
        if (!player) return;
        if (isPaused) {
            player.pauseVideo();
        } else {
            // Wait a tiny bit just in case we are in the middle of fading back
            setTimeout(() => {
                player.seekTo(0);
                player.playVideo();
            }, 100);
        }
    }, [isPaused, player]);

    return (
        <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
            <YouTube
                videoId={trailerKey}
                opts={opts}
                onReady={onReady}
                onStateChange={onStateChange}
                className="w-full h-full flex justify-center items-center"
                iframeClassName="w-full h-full border-none"
            />
        </div>
    );
}
