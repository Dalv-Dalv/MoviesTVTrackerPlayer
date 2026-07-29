import { type } from '@tauri-apps/plugin-os';
import { invoke } from '@tauri-apps/api/core';
import { init, command, observeProperties, getProperty } from 'tauri-plugin-libmpv-api';

const OBSERVED_PROPERTIES = [
    ['pause', 'flag'],
    ['time-pos', 'double', 'none'],
    ['duration', 'double', 'none'],
    ['filename', 'string', 'none'],
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
        // 'sid':'no'
    },
    observedProperties: OBSERVED_PROPERTIES,
}

const PROPERTY_DISPATCHER = {
    'pause': (data, h) => h.onPlayStateChange?.(!data),
    'time-pos': (data, h) => data !== null && h.onTimeUpdate?.(data),
    'duration': (data, h) => data !== null && h.onDuration?.(data),
    'eof-reached': (data, h) => data === true && h.onEnd?.(),
    'sub-text': (data, h) => h.onSubtitle?.(data),
    'sid': (data, h) => h.onSubtitleChange?.(data),
    'aid': (data, h) => h.onAudioChange?.(data),
    'volume': (data, h) => data !== null && h.onVolume?.(data),
    'max-volume': (data, h) => data !== null && h.onMaxVolume?.(data),
    'mute': (data, h) => h.onMute?.(data),
    'sub-text': (data, h) => h.onSubText?.(data),
    'track-list': (data, h) => {
        if (!data) return;
        h.onTrackListChange?.({
            audio: data.filter(track => track.type === 'audio'),
            subs: data.filter(track => track.type === 'sub')
        });
    },
};

const DesktopEngine = {
    init: async (handlers = {}) => {
        await init(mpvConfig);

        await observeProperties(OBSERVED_PROPERTIES, ({ name, data }) => {
            const dispatch = PROPERTY_DISPATCHER[name];
            if (dispatch) dispatch(data, handlers);
        });
    },

    load: async (url) => await command('loadfile', [url]),
    playPause: async () => await command('cycle', ['pause']),
    seek: async (seconds) => await command('seek', [seconds.toString(), 'relative']),
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
};

const AndroidEngine = {
    init: async (onTimeUpdate, onPauseChange) => {
        console.log("Android ExoPlayer ready.");
    },
    load: async (url) => await invoke('plugin:exoplayer|loadVideo', { url }),
    playPause: async () => await invoke('plugin:exoplayer|playPause'),
    seek: async (seconds) => await invoke('plugin:exoplayer|seek', { seconds })
};

const osType = type();
export const VideoPlayer = osType === 'android' ? AndroidEngine : DesktopEngine;