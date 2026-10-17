# HomeReel

> **Project Status**: HomeReel is in early active development. While core library scanning, tracking, and playback backends are functional, features, controls, and UI flows are evolving rapidly and there might be lots of bugs.

A cross-platform local media tracker and video player for Desktop (Windows, macOS, Linux) and Android, built with Tauri v2, React 19, and Vite.

HomeReel indexes local video files, queries metadata and artwork from The Movie Database (TMDB), tracks watch history and progress, and plays back media using native video backends: **libmpv** on desktop and **ExoPlayer** on Android.

## Features

### Library & Metadata
- **Local file indexing**: Recursively scans monitored directories for video files (`.mkv`, `.mp4`, `.avi`, `.webm`, `.mov`).
- **Filename parsing**: Extracts title, release year, season, and episode numbers using `video-name-parser`.
- **TMDB integration**: Fetches series/movie metadata, cast, crew, synopses, episode guides, and artwork.
- **Offline artwork cache**: Downloads and caches posters, backdrops, and logos locally in the application data directory.
- **Library manager**: Audit file matches, stage corrections, and apply bulk rematches.
- **File inspector**: Extracts codec, resolution, bitrate, HDR profiles, audio channels, and subtitle streams via `mediainfo.js` WebAssembly and chunked file reads.
- **Artwork switcher**: Browse and select alternative posters, backdrops, and logos directly from TMDB.

### Video Playback & Audio
- **Desktop (libmpv)**:
  - Hardware accelerated decoding (`gpu-next`, `d3d11`, `auto-safe`).
  - HDR/SDR tonemapping support. (WIP)
  - Multi-track audio and subtitle selection (ASS/SSA, SRT, PGS, VobSub).
  - Idle pause frame grabber for blurred background transitions.
- **Mobile (Android ExoPlayer)**:
  - Native surface playback using a custom Tauri ExoPlayer plugin (`tauri-plugin-exoplayer`).
  - Aspect ratio modes (fit, fill, zoom). (WIP)
  - Vertical edge swipe gestures for volume and brightness control.
  - Character encoding fixes for subtitle streams.

### Watch Tracking & Organization
- **Resume playback**: Remembers playback position per item and episode.
- **Up next detection**: Automatically tracks watched episodes and suggests the next episode in a season.
- **Completion status**: Marks items completed once playback exceeds 90%, with manual override toggles.
- **Per-media overrides**: Stores audio track and subtitle language preferences per title in addition to global defaults.
- **Trailers**: Embedded YouTube trailer player for movies and shows.

## Planned Features

- **Cross-platform sync**: Automatic synchronization of watch history, progress, resume timestamps, and settings between desktop and mobile devices.
- **Watchlist**: Shared, synchronized watchlists across devices.
- **Desktop-to-mobile streaming**: Stream media stored on a desktop host directly to mobile clients over local network.
- **TiDB integration (intro & credit detection)**: Automated detection and skip buttons for recaps, intros, and end credits, enabling precise completion tracking instead of percentage thresholds.
- **Seek preview thumbnails**: Real-time video frame scrubbing previews along the timeline.
- **Social & activity logging**: Letterboxd-style friend activity feeds to share watch logs, history, and ratings.
- **Extensive customization & settings (WIP)**: Configurable player behavior, custom keybindings, adjustable seek step intervals, gesture sensitivity tuning, and interface preferences.

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, Framer Motion, TanStack Query, Zustand
- **Desktop Runtime**: Tauri v2 (Rust)
- **Desktop Playback**: `tauri-plugin-libmpv` (libmpv C library bridge)
- **Android Playback**: `tauri-plugin-exoplayer` (Kotlin ExoPlayer implementation)
- **Metadata**: `@api-wrappers/tmdb-wrapper`, `video-name-parser`, `mediainfo.js`
- **Data Persistence**: `@tauri-apps/plugin-store`, `@tauri-apps/plugin-fs`

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- Platform-specific build tools:
  - **Windows**: Visual Studio C++ Build Tools and WebView2
  - **Linux**: Standard Tauri dependencies (`libwebkit2gtk`, `build-essential`, `libmpv-dev`, etc.)
  - **macOS**: Xcode command-line tools
  - **Android** (optional): Android Studio, NDK, JDK 17

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Dalv-Dalv/MoviesTVTrackerPlayer.git
   cd MoviesTVTrackerPlayer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your TMDB API key in `.env`:
   ```env
   VITE_TMDB_API_KEY=your_tmdb_api_key
   ```

### Development

Run the Tauri desktop application with hot reload:
```bash
npm run tauri dev
```

Run on a connected Android device or emulator:
```bash
npm run tauri android dev
```

Run the Vite frontend in a browser (UI-only testing):
```bash
npm run dev
```

### Production Build

**Desktop:**
```bash
npm run tauri build
```
The compiled binaries will be output to `src-tauri/target/release/bundle/`.

**Android:**
Build a release APK split by ABI targeting 64-bit ARM (`arm64-v8a`):
```bash
npm run tauri android build -- --apk --target aarch64 --split-per-abi
```
The output `.apk` file will be generated in `src-tauri/gen/android/app/build/outputs/apk/arm64-v8a/release/`.

## Controls

### Desktop Keyboard & Mouse
| Input | Action |
| --- | --- |
| `Space` | Play / Pause |
| `Left Arrow` | Seek backward 5 seconds |
| `Right Arrow` | Seek forward 5 seconds |
| `Down Arrow` | Seek backward 1 minute |
| `Up Arrow` | Seek forward 1 minute |
| `9` | Decrease volume by 2% |
| `0` | Increase volume by 2% |
| `M` | Toggle Mute |
| `F` / `F11` | Toggle Fullscreen |

*Extensive customization for player behavior, keybindings, seek intervals, and UI controls is currently in active development (WIP).*

### Mobile Touch Gestures
| Gesture | Action |
| --- | --- |
| `Left edge drag (vertical)` | Adjust screen brightness |
| `Right edge drag (vertical)` | Adjust volume |
| `Single tap (sides)` | Toggle player UI controls visibility |
| `Single tap (center)` | Wake player UI controls |
| `Double tap (left)` | Seek backward 10 seconds |
| `Double tap (right)` | Seek forward 10 seconds |
| `Double tap (center)` | Play / Pause |

## Project Structure

```
├── public/                    # Static files and MediaInfo WebAssembly binary
├── src/
│   ├── desktop/               # Desktop components, layouts, and libmpv engine
│   ├── mobile/                # Mobile views, gestures, and Android ExoPlayer engine
│   ├── shared/
│   │   ├── components/        # Reusable UI modals, cards, carousels
│   │   ├── hooks/             # Playback, data-fetching, and input hooks
│   │   ├── services/          # Scanner, TMDB client, MediaInfo parser
│   │   ├── store/             # Zustand stores (library, history, settings)
│   │   └── utils/             # Platform, formatting, and haptic helpers
│   ├── App.jsx                # Router, platform detection, and root layout
│   └── main.jsx
├── src-tauri/                 # Tauri configuration, Rust commands, and capabilities
└── tauri-plugin-exoplayer/    # In-tree Android ExoPlayer Tauri plugin
```

## License

MIT
