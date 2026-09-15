import { useEffect, useRef, useState } from "react";
import { VideoPlayer, VideoEvents } from '../services/VideoEngine';

export function useVideoState(videoPath) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [showBufferingSpinner, setShowBufferingSpinner] = useState(false);
    const bufferingTimeoutRef = useRef(null);
    const [isFirstFrameRendered, setIsFirstFrameRendered] = useState(false);
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

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
        setIsVideoLoaded(false);
        setDuration(0);
        setCurrentTime(0);
        setSubText(undefined);
        setIsBuffering(false);
        setShowBufferingSpinner(false);
        setIsFirstFrameRendered(false);
        setIsInitialLoadComplete(false);
        if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
    }, [videoPath]);

    useEffect(() => {
        if (isFirstFrameRendered && !isBuffering) {
            setIsInitialLoadComplete(true);
        }
    }, [isFirstFrameRendered, isBuffering]);

    useEffect(() => {
        const handlePlayStateChange = setIsPlaying;
        const handleDuration = (totalSeconds) => {
            setDuration(Math.floor(totalSeconds));
            setIsVideoLoaded(true);
        };
        const handleTimeUpdate = (rawTime) => {
            const currentSecond = Math.floor(rawTime);
            if (currentSecond !== lastSecondRef.current) {
                lastSecondRef.current = currentSecond;
                setCurrentTime(currentSecond);
            }
        };
        const handleEnd = () => setIsPlaying(false);
        const handleSubtitleChange = (id) => setSubs(prev => ({ ...prev, id }));
        const handleAudioChange = (id) => setAudio(prev => ({ ...prev, id }));
        const handleVolume = (vol) => setVolume(vol);
        const handleMaxVolume = (maxVol) => setMaxVolume(maxVol);
        const handleMute = (isMute) => setIsMute(isMute);
        const handleSubText = (subText) => {
            setSubText(subText);
        };
        const handleBuffering = (buffering) => {
            setIsBuffering(buffering);
            if (buffering) {
                bufferingTimeoutRef.current = setTimeout(() => {
                    setShowBufferingSpinner(true);
                }, 1000);
            } else {
                if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
                setShowBufferingSpinner(false);
            }
        };
        const handleFirstFrame = () => setIsFirstFrameRendered(true);
        const handleTrackListChange = ({ audio, subs }) => {
            setAudio(prev => ({ ...prev, tracks: audio }));
            setSubs(prev => ({ ...prev, tracks: subs }));
        };

        const eventHandlers = {
            onPlayStateChange: handlePlayStateChange,
            onDuration: handleDuration,
            onTimeUpdate: handleTimeUpdate,
            onEnd: handleEnd,
            onSubtitleChange: handleSubtitleChange,
            onAudioChange: handleAudioChange,
            onVolume: handleVolume,
            onMaxVolume: handleMaxVolume,
            onMute: handleMute,
            onSubText: handleSubText,
            onTrackListChange: handleTrackListChange,
            onBuffering: handleBuffering,
            onFirstFrameRendered: handleFirstFrame
        };

        Object.entries(eventHandlers).forEach(([eventName, handler]) => {
            VideoEvents[eventName].add(handler);
        });

        setIsPlayerReady(true);

        return () => {
            Object.entries(eventHandlers).forEach(([eventName, handler]) => {
                VideoEvents[eventName].delete(handler);
            });
        };
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

    return { isPlayerReady, isVideoLoaded, isPlaying, currentTime, duration, volume, isMute, subText, maxVolume, audio, subs, isBuffering, showBufferingSpinner, isFirstFrameRendered, isInitialLoadComplete };
}