import { type } from '@tauri-apps/plugin-os';
import { invoke } from '@tauri-apps/api/core';
import { init, command, observeProperties } from 'tauri-plugin-libmpv-api';

const OBSERVED_PROPERTIES = [
    ['pause', 'flag'],
    ['time-pos', 'double', 'none'],
    ['duration', 'double', 'none'],
    ['filename', 'string', 'none'],
    ['eof-reached', 'flag'],
    ['sub-text', 'string', 'none'] // Or sub-text-ass for more subtitle data
]
const mpvConfig = {
    initialOptions: {
        'vo': 'gpu-next',
        'hwdec': 'auto-safe',
        'osc': 'no',
        'osd-level':'0',
        'sub-visibility':'no',
        // 'sid':'no'
    },
    observedProperties: OBSERVED_PROPERTIES,
}

const DesktopEngine = {
    init: async (handlers = {}) => {
        await init(mpvConfig);

        await observeProperties(OBSERVED_PROPERTIES, ({ name, data }) => {
            if (name === 'pause' && handlers.onPlayStateChange)
                handlers.onPlayStateChange(!data);

            if (name === 'time-pos' && data !== null && handlers.onTimeUpdate)
                handlers.onTimeUpdate(data);

            if (name === 'duration' && data !== null && handlers.onDuration)
                handlers.onDuration(data);

            if (name === 'eof-reached' && data === true && handlers.onEnd)
                handlers.onEnd();

            if (name === 'sub-text') {
                console.log(data);
            }
        });
    },
    load: async (url) => await command('loadfile', [url]),
    playPause: async () => await command('cycle', ['pause']),
    seek: async (seconds) => await command('seek', [seconds.toString(), 'relative'])
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