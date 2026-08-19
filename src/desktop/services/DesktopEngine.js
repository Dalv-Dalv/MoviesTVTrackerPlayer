import { convertFileSrc } from '@tauri-apps/api/core';
import { init, command, observeProperties } from 'tauri-plugin-libmpv-api';
import { appCacheDir, join } from '@tauri-apps/api/path';
import { VideoEvents } from '../../shared/services/VideoEvents';

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

export const DesktopEngine = {
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
