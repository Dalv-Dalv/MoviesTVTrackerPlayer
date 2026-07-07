import React, { useState, useEffect, useRef } from 'react';
import { VideoPlayer } from './VideoEngine';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Ref to prevent React from crashing due to millisecond updates
  const lastSecondRef = useRef(-1);

  useEffect(() => {
    const setupVideo = async () => {
      await VideoPlayer.init(
        (time) => {
          const currentSecond = Math.floor(time);
          if (currentSecond !== lastSecondRef.current) {
            lastSecondRef.current = currentSecond;
            setCurrentTime(currentSecond);
          }
        },
        (playing) => {
          setIsPlaying(playing);
        }
      );
    };

    setupVideo();
  }, []);

  const loadVideo = async () => {
    await VideoPlayer.load('C:\\Dalv\\Movies and Shows\\Michael (2026) 2160p MA WEB-DL SDR 10bit HEVC [Hindi DDP 5.1 English DDP 5.1] x265 (BYNDR-UHDMovies).mkv');
    setHasVideo(true);
  };

  // Standard commands to control the video engine
  const togglePlay = () => VideoPlayer.playPause();
  const skipForward = () => VideoPlayer.seek(10);
  const skipBack = () => VideoPlayer.seek(-10);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    // THE CSS TRICK: bg-transparent when playing, bg-neutral-900 when idle!
    <div className={`h-screen w-screen flex flex-col items-center justify-end pb-12 transition-colors duration-500 ${hasVideo ? 'bg-transparent' : 'bg-neutral-900'}`}>

      {!hasVideo ? (
        <div className="flex-1 flex items-center justify-center">
          <button onClick={loadVideo} className="bg-emerald-500 text-black px-8 py-3 rounded-lg font-bold text-lg hover:scale-105 transition-transform">
            Load Movie
          </button>
        </div>
      ) : (
        <div className="bg-black/70 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/10 shadow-2xl w-[400px]">

          <div className="text-emerald-400 font-mono text-xl tracking-widest font-bold">
            {formatTime(currentTime)}
          </div>

          <div className="flex gap-4 w-full justify-center mt-2">
            <button onClick={skipBack} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold transition">
              -10s
            </button>

            <button onClick={togglePlay} className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-2 rounded font-bold transition w-32">
              {isPlaying ? "PAUSE" : "PLAY"}
            </button>

            <button onClick={skipForward} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold transition">
              +10s
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;