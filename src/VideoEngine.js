import { type } from '@tauri-apps/plugin-os';
import { init, command, observeProperties } from 'tauri-plugin-libmpv-api';
// We'll import the Android logic later

// 1. Desktop Implementation (LibMPV)
const DesktopEngine = {
  init: async (onTimeUpdate, onPauseChange) => {
    try {
      await init({
        initialOptions: {
          'vo': 'gpu-next',
          'hwdec': 'auto-safe'
        },
        observedProperties: [
          ['pause', 'flag'],
          ['time-pos', 'double', 'none']
        ]
      });

      await observeProperties([
        ['pause', 'flag'],
        ['time-pos', 'double', 'none']
      ], ({ name, data }) => {
        if (name === 'pause') onPauseChange(!data);
        if (name === 'time-pos' && data !== null) onTimeUpdate(data);
      });
      
    } catch (err) {
      console.error("MPV init failed:", err);
    }
  },
  load: async (url) => await command('loadfile', [url]),
  playPause: async () => await command('cycle', ['pause']),
  seek: async (seconds) => await command('seek', [seconds.toString(), 'relative']),
};

// 2. Android Implementation (Stub for now)
const AndroidEngine = {
  init: async (onTimeUpdate, onPauseChange) => {
    console.log("Initializing Android Engine...");
    // Android specific init goes here
  },
  load: async (url) => {
    console.log("Android loading: ", url);
    // Android specific load goes here
  },
  playPause: async () => console.log("Android play/pause"),
  seek: async (seconds) => console.log(`Android seeking ${seconds}s`),
};

// 3. The Exporter (The "Interface")
const osType = type(); // Returns 'windows', 'macos', 'android', etc.

// Export the correct engine based on the OS!
export const VideoPlayer = osType === 'android' ? AndroidEngine : DesktopEngine;