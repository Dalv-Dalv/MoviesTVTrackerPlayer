import { type } from '@tauri-apps/plugin-os';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { init, command, observeProperties, getProperty } from 'tauri-plugin-libmpv-api';
import { appCacheDir, join } from '@tauri-apps/api/path';

export const VideoEvents = {
    onPlayStateChange: new Set(),
    onTimeUpdate: new Set(),
    onDuration: new Set(),
    onEnd: new Set(),
    onSubtitle: new Set(),
    onSubtitleChange: new Set(),
    onAudioChange: new Set(),
    onVolume: new Set(),
    onMaxVolume: new Set(),
    onMute: new Set(),
    onSubText: new Set(),
    onTrackListChange: new Set(),
};

const OBSERVED_PROPERTIES = [
    ['pause', 'flag'],
    ['time-pos', 'double', 'none'],
    ['duration', 'double', 'none'],
    ['eof-reached', 'flag'],
    ['sub-text', 'string', 'none'], // Or sub-text/ass for more subtitle data
    ['track-list', 'node'],
    ['aid', 'int64', 'none'],
    ['sid', 'int64', 'none'],
    ['volume', 'double', 'none'],
    ['max-volume', 'double', 'none'],
    ['mute', 'flag'],
]
const mpvConfig = {
    initialOptions: {
        'vo': 'gpu-next',
        'hwdec': 'auto-safe',
        'osc': 'no',
        'osd-level': '0',
        'sub-visibility': 'no',
        'keep-open': 'yes',
        // 'sid':'no'
    },
    observedProperties: OBSERVED_PROPERTIES,
}

const PROPERTY_DISPATCHER = {
    'pause': (data) => {
        VideoEvents.onPlayStateChange.forEach(cb => cb(!data));
    },
    'time-pos': (data) => data !== null && VideoEvents.onTimeUpdate.forEach(cb => cb(data)),
    'duration': (data) => {
        if (data !== null) {
            VideoEvents.onDuration.forEach(cb => cb(data));
        }
    },
    'eof-reached': (data) => {
        if (data === true) {
            VideoEvents.onEnd.forEach(cb => cb());
        }
    },
    'sid': (data) => VideoEvents.onSubtitleChange.forEach(cb => cb(data)),
    'aid': (data) => VideoEvents.onAudioChange.forEach(cb => cb(data)),
    'volume': (data) => data !== null && VideoEvents.onVolume.forEach(cb => cb(data)),
    'max-volume': (data) => data !== null && VideoEvents.onMaxVolume.forEach(cb => cb(data)),
    'mute': (data) => VideoEvents.onMute.forEach(cb => cb(data)),
    'sub-text': (data) => VideoEvents.onSubText.forEach(cb => cb(data)),
    'track-list': (data) => {
        if (!data) return;
        VideoEvents.onTrackListChange.forEach(cb => cb({
            audio: data.filter(track => track.type === 'audio'),
            subs: data.filter(track => track.type === 'sub')
        }));
    },
};

let isMpvInitialized = false;

const DesktopEngine = {
    init: async () => {
        if (isMpvInitialized) return;

        await init(mpvConfig);

        await observeProperties(OBSERVED_PROPERTIES, ({ name, data }) => {
            const dispatch = PROPERTY_DISPATCHER[name];
            if (dispatch) dispatch(data);
        });

        isMpvInitialized = true;
    },

    load: async (url) => await command('loadfile', [url]),

    stop: async () => await command('stop'),

    setPaused: async (isPaused) => await command('set', ['pause', isPaused ? 'yes' : 'no']),
    playPause: async () => await command('cycle', ['pause']),
    seek: async (seconds) => await command('seek', [seconds.toString(), 'relative']),
    seekTo: async (seconds) => await command('seek', [seconds.toString(), 'absolute']),
    seekToPercentage: async (percentage) => await command('seek', [percentage.toString(), 'absolute-percent']),

    addVolume: async (vol) => await command('add', ['volume', vol]),
    setVolume: async (vol) => await command('set', ['volume', vol]),
    toggleMute: async () => await command('cycle', ['mute']),
    setMaxVolume: async (maxVol) => await command('set', ['max-volume', maxVol]),

    setAudioTrack: async (id) => await command('set', ['aid', id.toString()]),
    setSubtitleTrack: async (id) => await command('set', ['sid', id.toString()]),
    addSubtitle: async (url) => await command('sub-add', [url]),
    setSubVisibility: async (visible) => await command('set', ['sub-visibility', visible ? 'yes' : 'no']),

    cycleAudioTracks: async (upDown = 'up') => await command('cycle', ['aid', upDown]),
    cycleSubtitles: async (upDown = 'up') => await command('cycle', ['sid', upDown]),

    captureFrame: async () => {
        try {
            const cacheFolder = await appCacheDir();
            const filePath = await join(cacheFolder, 'capture_frame.jpg');

            console.log(filePath);

            await command('screenshot-to-file', [filePath, 'subtitles']); // add 'scaled' if lag

            const tauriUrl = convertFileSrc(filePath) + `?t=${Date.now()}`;

            console.log(tauriUrl);

            return tauriUrl;
        } catch (error) {
            console.error("Failed to capture frame: ", error);
            return null;
        }
    },
};

const AndroidEngine = {
    init: async (onTimeUpdate, onPauseChange) => {
        console.log("Android ExoPlayer ready.");
    },
    load: async (url) => {
        try {
            await invoke('plugin:exoplayer|loadVideo', { url });

            setTimeout(() => {
                VideoEvents.onDuration.forEach(cb => cb(0));
                VideoEvents.onPlayStateChange.forEach(cb => cb(true));
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
    setVolume: async (vol) => console.log("TODO Android setVolume", vol),
    addVolume: async (vol) => console.log("TODO Android addVolume", vol),
    toggleMute: async () => console.log("TODO Android toggleMute"),
    captureFrame: async () => null,
    stop: async () => console.log("TODO Android stop"),
    setSubVisibility: async (visible) => console.log("TODO Android setSubVisibility", visible),
    getCurrentTime: async () => await invoke('plugin:exoplayer|getCurrentTime')
};

const osType = type();
export const VideoPlayer = osType === 'android' ? AndroidEngine : DesktopEngine;