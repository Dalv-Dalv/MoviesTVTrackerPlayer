import { useEffect, useRef, useState } from "react";
import { VideoPlayer } from "../../shared/VideoEngine";

export function useVideoState() {
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audio, setAudio] = useState({ id: 1, tracks: [] });
    const [subs, setSubs] = useState({ id: 1, tracks: [] });
    const lastSecondRef = useRef(-1);

    useEffect(() => {
        VideoPlayer.init({
            onPlayStateChange: setIsPlaying,
            onDuration: (totalSeconds) => setDuration(Math.floor(totalSeconds)),
            onTimeUpdate: (rawTime) => {
                const currentSecond = Math.floor(rawTime);
                if (currentSecond !== lastSecondRef.current) {
                    lastSecondRef.current = currentSecond;
                    setCurrentTime(currentSecond);
                }
            },
            onEnd: () => setIsPlaying(false),
            onTrackListChange: ({ audio, subs }) => {
                setAudio(prev => ({ ...prev, tracks: audio }));
                setSubs(prev => ({ ...prev, tracks: subs }));
            },
            onSubtitleChange: (id) => setSubs(prev => ({ ...prev, id })),
            onAudioChange: (id) => setAudio(prev => ({ ...prev, id })),
        });
    }, []);

    return { isPlaying, currentTime, setCurrentTime, duration, audio, subs };
}