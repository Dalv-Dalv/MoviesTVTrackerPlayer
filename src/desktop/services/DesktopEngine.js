import { convertFileSrc } from '@tauri-apps/api/core';
import { init, command, observeProperties, getProperty } from 'tauri-plugin-libmpv-api';
import { appCacheDir, join } from '@tauri-apps/api/path';
import { VideoEvents } from '../../shared/services/VideoEvents';

const OBSERVED_PROPERTIES = [
    ['pause', 'flag'],
    ['duration', 'double', 'none'],
    ['eof-reached', 'flag'],
    ['sub-text', 'string', 'none'], // Or sub-text/ass for more subtitle data
    ['track-list', 'node'],
    ['aid', 'int64', 'none'],
    ['sid', 'int64', 'none'],
    ['volume', 'double', 'none'],
    ['max-volume', 'double', 'none'],
    ['mute', 'flag'],
    ['paused-for-cache', 'flag'],
]
const mpvConfig = {
    initialOptions: {
        'vo': 'gpu-next',
        'gpu-context': 'd3d11',
        'target-colorspace-hint': 'yes',
        'hwdec': 'auto-safe',
        'hr-seek': 'no',
        'cache': 'yes',
        'demuxer-max-bytes': '1600M',
        'demuxer-max-back-bytes': '400M',
        'volume-max': '300',
        'sub-pos': '95',
        'sub-scale': '0.5',
        'osc': 'no',
        'osd-level': '0',
        'sub-visibility': 'no',
        'keep-open': 'yes',
        'force-window': 'immediate',
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
    'paused-for-cache': (data) => VideoEvents.onBuffering.forEach(cb => cb(data)),
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
let firstFrameFired = false;

export const DesktopEngine = {
    init: async () => {
        if (isMpvInitialized) return;

        await init(mpvConfig);

        await observeProperties(OBSERVED_PROPERTIES, ({ name, data }) => {
            const dispatch = PROPERTY_DISPATCHER[name];
            if (dispatch) dispatch(data);
        });

        setInterval(async () => {
            try {
                const time = await getProperty('time-pos', 'double');
                if (time !== null) {
                    PROPERTY_DISPATCHER['time-pos'](time);
                    if (!firstFrameFired) {
                        VideoEvents.onFirstFrameRendered.forEach(cb => cb(true));
                        firstFrameFired = true;
                    }
                }
            } catch (e) {
                // Ignore errors when nothing is playing
            }
        }, 500);

        isMpvInitialized = true;
    },

    load: async (url, startTime = 0) => {
        firstFrameFired = false;
        VideoEvents.onBuffering.forEach(cb => cb(true));
        
        if (startTime > 0) {
            await command('set', ['start', startTime.toString()]);
        }
        await command('loadfile', [url]);
    },

    stop: async () => await command('stop'),

    setPaused: async (isPaused) => await command('set', ['pause', isPaused ? 'yes' : 'no']),
    playPause: async () => await command('cycle', ['pause']),
    seek: async (seconds) => await command('seek', [seconds.toString(), 'relative']),
    seekTo: async (seconds) => await command('seek', [seconds.toString(), 'absolute']),
    seekToPercentage: async (percentage) => await command('seek', [percentage.toString(), 'absolute-percent']),

    getVolume: async () => {
        try {
            return { volume: parseFloat(await command('get_property', ['volume'])) || 100.0 };
        } catch { return { volume: 100.0 }; }
    },
    addVolume: async (vol) => await command('add', ['volume', vol]),
    setVolume: async (vol) => await command('set', ['volume', vol]),
    toggleMute: async () => await command('cycle', ['mute']),
    setMaxVolume: async (maxVol) => await command('set', ['max-volume', maxVol]),
    
    getBrightness: async () => {
        try {
            return { brightness: parseFloat(await command('get_property', ['brightness'])) || 50.0 };
        } catch { return { brightness: 50.0 }; }
    },
    addBrightness: async (val) => await command('add', ['brightness', val.toString()]),
    setBrightness: async (val) => await command('set', ['brightness', val.toString()]),
    setAudioTrack: async (id) => await command('set', ['aid', id.toString()]),
    setSubtitleTrack: async (id) => await command('set', ['sid', id.toString()]),
    addSubtitle: async (url) => await command('sub-add', [url]),
    setSubVisibility: async (visible) => await command('set', ['sub-visibility', visible ? 'yes' : 'no']),

    setSDRTonemapping: async (enabled) => {
        if (enabled) {
            await command('set', ['target-colorspace-hint', 'no']);
            await command('set', ['target-peak', '203']);
        } else {
            await command('set', ['target-colorspace-hint', 'yes']);
            await command('set', ['target-peak', 'auto']);
        }
    },

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
