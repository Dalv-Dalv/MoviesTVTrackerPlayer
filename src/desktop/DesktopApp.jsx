import React, { useState, useEffect, useRef, useCallback } from 'react';
import parseVideo from 'video-name-parser';
import { open } from '@tauri-apps/plugin-dialog';
import { VideoPlayer } from '../shared/VideoEngine';
import { usePlayerShortcuts } from './usePlayerShortcuts';
import { extractVideoMetadata } from '../shared/MetadataExtractor';
import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon, ClosedCaptioningIcon, HeadphonesIcon, MusicNoteIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from '@phosphor-icons/react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import OutlinedIcon from '../shared/IconUtilies';

const appWindow = getCurrentWindow();

const PlayerButton = ({ children, onClick, className = '', ...props}) => {
    return (
        <button className={`bg-black/10 hover:bg-black/40 p-1.5 rounded-sm transition-colors duration-200 ${className}`}
            onClick={onClick}
            {...props}>

            {children}
        </button>
    );
}

function DesktopApp() {
    const [isPlaying, setIsPlaying] = useState(true);
    const [hasVideo, setHasVideo] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showRemainingTime, setShowRemainingTime] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [aid, setAid] = useState(1);
    const [audioTracks, setAudioTracks] = useState([]);
    const [sid, setSid] = useState(1);
    const [subTracks, setSubTracks] = useState([]);
    
    const lastSecondRef = useRef(-1);



    const [showControls, setShowControls] = useState(true);
    
    const timeoutRef = useRef(null);
    const isHoveringInteractiveRef = useRef(false);

    const wakeUI = useCallback(() => {
        setShowControls(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            if (!isHoveringInteractiveRef.current) setShowControls(false);
        }, 1000);
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
        wakeUI();
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
            },

            onTrackListChange: ({ audio, subs }) => {
                console.log(audio);
                console.log(subs);
                setAudioTracks(audio);
                setSubTracks(subs);
            },

            onSubtitleChange: (sid) => { setSid(sid); },

            onAudioChange: (aid) => { setAid(aid); },
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
            await VideoPlayer.load(filePath);
            setHasVideo(true);
        }
    };

    const togglePlay = () => VideoPlayer.playPause();
    const skipForward = () => VideoPlayer.seek(10);
    const skipBack = () => VideoPlayer.seek(-10);
    const toggleFullscreen = async (fullscreen) => {
        const newState = fullscreen === undefined ? !(await appWindow.isFullscreen()) : fullscreen;
        await appWindow.setFullscreen(newState);
        
        setIsFullscreen(newState);
    };
    const cycleAudioTracks = () => VideoPlayer.cycleAudioTracks();
    const cycleSubtitles = () => VideoPlayer.cycleSubtitles();

    useEffect(() => {
        let unlistenResize;

        const setupWindowListeners = async () => {
            unlistenResize = await appWindow.onResized(async () => {
                const isNowFullscreen = await appWindow.isFullscreen();
                
                setIsFullscreen(prev => {
                    if (prev !== isNowFullscreen) return isNowFullscreen;
                    return prev;
                });
            });
        };

        setupWindowListeners();

        return () => { if (unlistenResize) unlistenResize(); };
    }, []);




    const progressBarRef = useRef(null);
    const isScrubbing = useRef(false);

    const handleScrub = useCallback((e) => {
        if (!progressBarRef.current || duration === 0) return;
        
        const rect = progressBarRef.current.getBoundingClientRect();
        const rawPercent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 100.0;
        const safePercent = rawPercent.toFixed(3);
        const newTime = (rawPercent / 100) * duration;

        setCurrentTime(newTime);
        
        VideoPlayer.seekToPercentage(safePercent);
    }, [duration]);

    useEffect(() => {
        const onMouseMove = (e) => {
            if (isScrubbing.current) handleScrub(e);
        };
        
        const onMouseUp = () => {
            isScrubbing.current = false;
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [handleScrub]);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s
                .toString()
                .padStart(2, '0')}`;
        }

        return `${m}:${s.toString().padStart(2, '0')}`;
    };




    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    VideoPlayer.playPause();
                    break;

                case 'ArrowRight':
                    VideoPlayer.seek(10);
                    break;

                case 'ArrowLeft':
                    VideoPlayer.seek(-10);
                    break;

                case 'F':
                case 'f':
                    if (e.shiftKey) {
                        console.log("TODO: Make subtitles smaller");
                    } else {
                        toggleFullscreen();
                    }
                    break;

                case 'Escape':
                    toggleFullscreen(false);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className={`h-screen w-screen flex flex-col items-center justify-end transition-colors duration-500 ${hasVideo ? 'bg-transparent' : 'bg-neutral-900'}`}>

            {!hasVideo ? (
                <div className="flex-1 flex items-center justify-center">
                    <button onClick={loadVideo} className="bg-red-500 text-black px-8 py-3 rounded-lg font-bold text-lg hover:scale-105 transition-transform">
                        Load Movie
                    </button>
                </div>
            ) : (
                <div className={`relative w-full h-full flex items-center flex-col justify-between noselect
                                 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} onMouseMove={wakeUI}>
                    <div className='w-8 h-8 bg-red-500/0'></div>

                    <div className={`w-full h-full bg-transparent ${showControls ? 'cursor-default' : 'cursor-none'}`} onClick={togglePlay} onDoubleClick={toggleFullscreen}/>
                    
                    <div className='w-full bg-[linear-gradient(to_top,rgba(0,0,0,0.5)_30%,transparent_100%),radial-gradient(6000px_circle_at_50%_6000px,rgba(0,0,0,.85)_99%,transparent_100%)]
                        flex flex-col justify-center text-white items-stretch' onMouseEnter={handleInteractiveEnter} onMouseLeave={handleInteractiveLeave}>
                        
                        <div ref={progressBarRef} className='mx-4 py-2 group cursor-pointer' onMouseDown={(e) => {
                            isScrubbing.current = true;
                            console.log('hello??');
                            handleScrub(e);
                        }}>
                            <div className='relative h-1 rounded group-hover:h-1.5 transition-[height] duration-100 overflow-hidden'>
                                <div className='absolute inset-0 bg-white/40 group-hover:bg-white/60 transition-colors duration-100 border border-white/10 group-hover:border-white/30'/>
                                <div className='absolute inset-0 bg-red-500 border border-red-400/50' style={{width: `${progress}%`}}/>
                            </div>
                        </div>

                        <div className='px-6 pb-4 pt-1 flex justify-between items-center'>
                            <div className='flex justify-between items-center gap-2'>
                                <PlayerButton onClick={togglePlay}>
                                    {isPlaying ? (
                                        <PauseIcon size={25} weight='fill'/>
                                    ) : (
                                        <PlayIcon size={25} weight='fill' className='-translate-x-0.5'/>
                                    )}
                                </PlayerButton>

                                {/* <PlayerButton>
                                    <SkipBackIcon size={25} weight='fill'/>
                                </PlayerButton>

                                <PlayerButton>
                                    <SkipForwardIcon size={25} weight='fill'/>
                                </PlayerButton> */}
                            
                                <span className='font-semibold bg-black/10 px-3 py-1.5 rounded-sm'>
                                    {formatTime(currentTime)}
                                </span>
                            </div>

                            <div className='flex justify-between items-center gap-2'>
                                <PlayerButton className='font-semibold px-3 py-1.5' onClick={() => setShowRemainingTime(prev => !prev)}>
                                    {showRemainingTime ? `-${formatTime(duration - currentTime)}` : formatTime(duration)}
                                </PlayerButton>
                                
                                <PlayerButton className='flex gap-1 justify-center items-center' onClick={cycleAudioTracks}>
                                    {aid === null ? (<></>) : (<span className='font-semibold'>{aid}/{audioTracks.length}</span>)}
                                    <HeadphonesIcon size={25} weight={`${aid === null ? 'regular' : 'fill'}`}/>
                                </PlayerButton>

                                <PlayerButton className='flex gap-1 justify-center items-center' onClick={cycleSubtitles}>
                                    {sid === null ? (<></>) : (<span className='font-semibold'>{sid}/{subTracks.length}</span>)}
                                    <ClosedCaptioningIcon size={25} weight={`${sid === null ? 'regular' : 'fill'}`}/>
                                </PlayerButton>

                                <PlayerButton onClick={(e) => toggleFullscreen()}>
                                    {isFullscreen ? (
                                        <ArrowsInSimpleIcon size={25} weight='fill'/>
                                    ) : (
                                        <ArrowsOutSimpleIcon size={25} weight='fill'/>
                                    )}
                                </PlayerButton>
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