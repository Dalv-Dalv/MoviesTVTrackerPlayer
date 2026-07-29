import { useEffect, useRef, useState } from "react";
import { VideoPlayer } from "../../shared/VideoEngine";

export function useVideoState() {
    const [isPlaying, setIsPlaying] = useState(true);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const lastSecondRef = useRef(-1);

    const [audio, setAudio] = useState({ id: 1, tracks: [] });
    const [subs, setSubs] = useState({ id: 1, tracks: [] });

    const [volume, setVolume] = useState(100);
    const [isMute, setIsMute] = useState(false);
    const [maxVolume, setMaxVolume] = useState(100);

    const [subText, setSubText] = useState(undefined);

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

            onSubtitleChange: (id) => setSubs(prev => ({ ...prev, id })),

            onAudioChange: (id) => setAudio(prev => ({ ...prev, id })),

            onVolume: (vol) => setVolume(vol),

            onMaxVolume: (maxVol) => setMaxVolume(maxVol),

            onMute: (isMute) => setIsMute(isMute),

            onSubText: (subText) => {
                setSubText(subText);
                console.log(`Sub text: ${subText}`);
            },

            onTrackListChange: ({ audio, subs }) => {
                setAudio(prev => ({ ...prev, tracks: audio }));
                setSubs(prev => ({ ...prev, tracks: subs }));

                console.log(audio);
                console.log(subs);
            },
        });
    }, []);

    useEffect(() => {
        if (!subs.tracks || subs.tracks.length === 0 || subs.id === null) {
            if (VideoPlayer.setSubVisibility) VideoPlayer.setSubVisibility(false);
            return;
        }

        const activeTrack = subs.tracks.find(t => t.id === subs.id);
        if (activeTrack && VideoPlayer.setSubVisibility) {
            const isImageBased = ['pgs', 'dvd', 'dvb'].some(marker => activeTrack.codec?.toLowerCase().includes(marker));
            VideoPlayer.setSubVisibility(isImageBased);
        }
    }, [subs.id, subs.tracks]);

    return { isPlaying, currentTime, setCurrentTime, duration, volume, isMute, subText, maxVolume, audio, subs };
}