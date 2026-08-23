import { invoke } from '@tauri-apps/api/core';
import { VideoEvents } from '../../shared/services/VideoEvents';

function fixMojibake(str) {
    if (!str) return str;
    const cp1252 = [
        0x20AC, 0x81, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021,
        0x02C6, 0x2030, 0x0160, 0x2039, 0x0152, 0x8D, 0x017D, 0x8F,
        0x90, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014,
        0x02DC, 0x2122, 0x0161, 0x203A, 0x0153, 0x9D, 0x017E, 0x0178
    ];
    let bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        let cpIndex = cp1252.indexOf(code);
        if (cpIndex !== -1) {
            bytes[i] = 0x80 + cpIndex;
        } else if (code <= 0xFF) {
            bytes[i] = code;
        } else {
            return str;
        }
    }
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch(e) {
        return str;
    }
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
    'mute': (data) => VideoEvents.onMute.forEach(cb => cb(data)),
    'sub-text': (data) => VideoEvents.onSubText.forEach(cb => cb(fixMojibake(data))),
    'track-list': (data) => {
        if (!data) return;
        VideoEvents.onTrackListChange.forEach(cb => cb({
            audio: data.filter(track => track.type === 'audio'),
            subs: data.filter(track => track.type === 'sub')
        }));
    },
};

export const AndroidEngine = {
    init: async (onTimeUpdate, onPauseChange) => {
        window.addEventListener('exoplayer-event-raw', (e) => {
            const { name, data } = e.detail;

            if (data === undefined || data === null) return;

            const dispatch = PROPERTY_DISPATCHER[name];
            if (dispatch) dispatch(data);
        });
        
        console.log("Android ExoPlayer ready.");
    },

    load: async (url) => {
        try {
            await invoke('plugin:exoplayer|loadVideo', { url });
            await invoke('plugin:exoplayer|setSubVisibility', { visible: false });

            setTimeout(() => {
                VideoEvents.onDuration.forEach(cb => cb(0));
            }, 500);
        } catch (e) {
            console.error("Failed to load video on Android:", e);
        }
    },

    stop: async () => await invoke('plugin:exoplayer|stop'),

    setPaused: async (isPaused) => await invoke('plugin:exoplayer|setPaused', { isPaused }),
    playPause: async () => await invoke('plugin:exoplayer|playPause'),
    seek: async (seconds) => await invoke('plugin:exoplayer|seek', { seconds }),
    seekTo: async (seconds) => await invoke('plugin:exoplayer|seekTo', { seconds }),
    seekToPercentage: async (percent) => await invoke('plugin:exoplayer|seekToPercentage', { percent }),
    
    setResizeMode: async (mode) => await invoke('plugin:exoplayer|setResizeMode', { mode }),
    
    addVolume: async (vol) => await invoke('plugin:exoplayer|addVolume', { vol }),
    setVolume: async (vol) => await invoke('plugin:exoplayer|setVolume', { vol }),
    toggleMute: async () => await invoke('plugin:exoplayer|toggleMute'),
    
    setSubVisibility: async (visible) => await invoke('plugin:exoplayer|setSubVisibility', { visible }),
    setAudioTrack: async (id) => await invoke('plugin:exoplayer|setAudioTrack', { id: id.toString() }),
    setSubtitleTrack: async (id) => await invoke('plugin:exoplayer|setSubtitleTrack', { id: id.toString() }),
    addSubtitle: async (url) => await invoke('plugin:exoplayer|addSubtitle', { url }),
    
    captureFrame: async () => {
        const result = await invoke('plugin:exoplayer|captureFrame').catch(() => null);
        if (!result || !result.path) return null;

        return convertFileSrc(result.path) + `?t=${Date.now()}`;
    },
};
