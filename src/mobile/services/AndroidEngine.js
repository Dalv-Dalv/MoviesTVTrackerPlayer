import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { VideoEvents } from '../../shared/services/VideoEvents';

export const AndroidEngine = {
    init: async (onTimeUpdate, onPauseChange) => {
        await listen('exoplayer-event', (event) => {
            const { type, value } = event.payload;

            if (type === 'pause') {
                VideoEvents.onPlayStateChange.forEach(cb => cb(!value));
            }
        });

        console.log("Android ExoPlayer ready.");
    },
    load: async (url) => {
        try {
            await invoke('plugin:exoplayer|loadVideo', { url });

            setTimeout(() => {
                VideoEvents.onDuration.forEach(cb => cb(0));
            }, 500);
        } catch (e) {
            console.error("Failed to load video on Android:", e);
        }
    },
    playPause: async () => await invoke('plugin:exoplayer|playPause'),
    setPaused: async (isPaused) => console.log("TODO Android setPaused", isPaused),
    seek: async (seconds) => await invoke('plugin:exoplayer|seek', { seconds }),
    seekTo: async (seconds) => console.log("TODO Android seekTo", seconds),
    seekToPercentage: async (percent) => console.log("TODO Android seekToPercentage", percent),
    setResizeMode: async (mode) => await invoke('plugin:exoplayer|setResizeMode', { mode }),
    setVolume: async (vol) => console.log("TODO Android setVolume", vol),
    addVolume: async (vol) => console.log("TODO Android addVolume", vol),
    toggleMute: async () => console.log("TODO Android toggleMute"),
    captureFrame: async () => null,
    stop: async () => console.log("TODO Android stop"),
    setSubVisibility: async (visible) => console.log("TODO Android setSubVisibility", visible),
    getCurrentTime: async () => await invoke('plugin:exoplayer|getCurrentTime')
};
