import React, { useState, useEffect, useRef, useCallback } from 'react';
import parseVideo from 'video-name-parser';
import { open } from '@tauri-apps/plugin-dialog';
import { VideoPlayer } from '../shared/VideoEngine';
import { usePlayerShortcuts } from './usePlayerShortcuts';
import { extractVideoMetadata } from '../shared/MetadataExtractor';
import { ArrowsOutSimpleIcon, PauseIcon, SkipBackIcon, SkipForwardIcon } from '@phosphor-icons/react';
import OutlinedIcon from '../shared/IconUtilies';

function DesktopApp() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const lastSecondRef = useRef(-1);

    usePlayerShortcuts();




    const [showControls, setShowControls] = useState(true);
    
    const timeoutRef = useRef(null);
    const isHoveringInteractiveRef = useRef(false);

    const wakeUI = useCallback(() => {
        setShowControls(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            if (!isHoveringInteractiveRef.current) setShowControls(false);
        }, 3000);
    }, []);

    useEffect(() => {
        wakeUI();
        return () => clearTimeout(timeoutRef.current);
    }, [wakeUI]);

    const handleInteractiveEnter = () => {
        isHoveringInteractiveRef.current = true;
    };

    const handleInteractiveLeave = () => {
        isHoveringInteractiveRef.current = false;
        wakeAndResetTimer();
    };




    useEffect(() => {
        VideoPlayer.init({
            onPlayStateChange: (playing) => setIsPlaying(playing),

            onDuration: (totalSeconds) => {
                setDuration(Math.floor(totalSeconds));
            },

            onTimeUpdate: (rawTime) => {
                const currentSecond = Math.floor(rawTime);
                
                if (currentSecond !== lastSecondRef.current) {
                    lastSecondRef.current = currentSecond;
                    setCurrentTime(currentSecond);
                }
            },

            onEnd: () => {
                console.log("Video finished");
                setIsPlaying(false);
            }
        });
    }, []);

    const loadVideo = async () => {
        const filePath = await open({
            multiple: false,
            directory: false,
            filters: [{
                name: 'Movies',
                extensions: ['mp4', 'mkv', 'webm', 'mov']
            }]
        });

        if (filePath) {
            const fileName = filePath.split(/[/\\]/).pop();
            // console.log(parseVideo(fileName));

            // const metadata = await extractVideoMetadata(filePath);
            // const tracks = metadata.media.track;

            // const generalTrack = tracks.find(t => t['@type'] === 'General');
            // const durationSeconds = parseFloat(generalTrack.Duration);
            // const videoTrack = tracks.find(t => t['@type'] === 'Video');
            // const audioTracks = tracks.filter(t => t['@type'] === 'Audio');
            // const subtitleTracks = tracks.filter(t => t['@type'] === 'Text');

            // console.log("Is 4K?", videoTrack.Width >= 3840);
            // console.log("Is HDR?", videoTrack.HDR_Format !== undefined);
            // console.log(`Duration: ${durationSeconds} seconds`);

            // console.log("Audio Tracks:", audioTracks.map(a => a.Language || 'Unknown'));
            // console.log("Subtitles:", subtitleTracks.map(s => s.Language || 'Unknown'));

            await VideoPlayer.load(filePath);
            setHasVideo(true);
        }
    };

    const togglePlay = () => VideoPlayer.playPause();
    const skipForward = () => VideoPlayer.seek(10);
    const skipBack = () => VideoPlayer.seek(-10);

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s
                .toString()
                .padStart(2, '0')}`;
        }

        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`h-screen w-screen flex flex-col items-center justify-end transition-colors duration-500 ${hasVideo ? 'bg-transparent' : 'bg-neutral-900'}`}>

            {!hasVideo ? (
                <div className="flex-1 flex items-center justify-center">
                    <button onClick={loadVideo} className="bg-red-500 text-black px-8 py-3 rounded-lg font-bold text-lg hover:scale-105 transition-transform">
                        Load Movie
                    </button>
                </div>
            ) : (
                <div className='relative w-full h-full flex items-center flex-col justify-between' onMouseMove={wakeUI}>
                    <div className='w-8 h-8 bg-red-500/0'></div>
                    <div className='w-full bg-[linear-gradient(to_top,rgba(0,0,0,0.5)_30%,transparent_100%),radial-gradient(6000px_circle_at_50%_6000px,rgba(0,0,0,.85)_99%,transparent_100%)]
                        flex flex-col justify-center text-body items-stretch'>
                        
                        <div className='py-2 group cursor-pointer'>
                            <div className='bg-red-500 h-1 mx-4 rounded group-hover:h-1.5 transition-[height] duration-100 border border-red-400'/>
                        </div>

                        <div className='px-6 pb-4 flex justify-between items-center'>
                            <div className='flex justify-between items-center gap-2'>
                                <PauseIcon size={30} weight='fill'/>
                                <SkipBackIcon size={30} weight='fill'/>
                                <SkipForwardIcon size={30} weight='fill'/>

                                <span className='text-lg font-semibold'>
                                    {formatTime(currentTime)}
                                </span>
                            </div>

                            <div className='flex justify-between items-center gap-2'>
                                <span className='text-lg font-semibold'>
                                    -{formatTime(5000 - currentTime)}
                                </span>

                                <OutlinedIcon Icon={ArrowsOutSimpleIcon} size={30} />
                            </div>
                        </div>
                    </div>
                </div>
                // <div className="bg-neutral-950/85 p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] shadow-inner-[inset_0_1px_0_rgba(255,255,255,0.1)] w-[400px]">

                //     <div className="text-emerald-400 font-mono text-xl tracking-widest font-bold">
                //         {formatTime(currentTime)}
                //     </div>

                //     <div className="flex gap-4 w-full justify-center mt-2">
                //         <button onClick={skipBack} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold transition">
                //             -10s
                //         </button>

                //         <button onClick={togglePlay} className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-2 rounded font-bold transition w-32">
                //             {isPlaying ? "PAUSE" : "PLAY"}
                //         </button>

                //         <button onClick={skipForward} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold transition">
                //             +10s
                //         </button>
                //     </div>
                // </div>
            )}
        </div>
    );
}

export default DesktopApp;