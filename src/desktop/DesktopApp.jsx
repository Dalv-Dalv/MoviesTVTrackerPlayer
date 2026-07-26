import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { VideoPlayer } from '../shared/VideoEngine';
import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon, ClosedCaptioningIcon, HeadphonesIcon, MusicNoteIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from '@phosphor-icons/react';

import { formatTime } from '../shared/PlayerUtils';

import { useKeyboardShortcuts, useVideoScrubber, useVideoState } from './hooks/';
import { useWakeUI, useFullscreen } from '../shared/hooks/';

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
    const [hasVideo, setHasVideo] = useState(false);
    const [showRemainingTime, setShowRemainingTime] = useState(true);

    const { isPlaying, currentTime, setCurrentTime, duration, audio, subs } = useVideoState();
    const { isFullscreen, toggleFullscreen } = useFullscreen();
    const { showControls, wakeUI, handleInteractiveEnter, handleInteractiveLeave } = useWakeUI();
    const { progressBarRef, isScrubbing, handleScrub } = useVideoScrubber(duration, setCurrentTime);

    const togglePlay = () => VideoPlayer.playPause();
    const cycleAudioTracks = () => VideoPlayer.cycleAudioTracks();
    const cycleSubtitles = () => VideoPlayer.cycleSubtitles();
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    useKeyboardShortcuts({ togglePlay, toggleFullscreen });

    const loadVideo = async () => {
        const filePath = await open({
            multiple: false, directory: false,
            filters: [{ name: 'Movies', extensions: ['mp4', 'mkv', 'webm', 'mov'] }]
        });

        if (filePath) {
            await VideoPlayer.load(filePath);
            setHasVideo(true);
        }
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
                <div className={`relative w-full h-full flex items-center flex-col justify-between noselect
                                 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} onMouseMove={wakeUI}>
                    <div className='w-8 h-8 bg-red-500/0'></div>

                    <div className={`w-full h-full bg-transparent ${showControls ? 'cursor-default' : 'cursor-none'}`} onClick={togglePlay} onDoubleClick={toggleFullscreen}/>
                    
                    <div className='w-full bg-[linear-gradient(to_top,rgba(0,0,0,0.5)_30%,transparent_100%),radial-gradient(6000px_circle_at_50%_6000px,rgba(0,0,0,.85)_99%,transparent_100%)]
                        flex flex-col justify-center text-white items-stretch' onMouseEnter={handleInteractiveEnter} onMouseLeave={handleInteractiveLeave}>
                        
                        <div ref={progressBarRef} className='mx-4 py-2 group cursor-pointer' onMouseDown={(e) => {
                            isScrubbing.current = true;
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

                                <span className='font-semibold bg-black/10 px-3 py-1.5 rounded-sm'>
                                    {formatTime(currentTime)}
                                </span>
                            </div>

                            <div className='flex justify-between items-center gap-2'>
                                <PlayerButton className='font-semibold px-3 py-1.5' onClick={() => setShowRemainingTime(prev => !prev)}>
                                    {showRemainingTime ? `-${formatTime(duration - currentTime)}` : formatTime(duration)}
                                </PlayerButton>
                                
                                <PlayerButton className='flex gap-1 justify-center items-center' onClick={cycleAudioTracks}>
                                    {audio.id === null ? (<></>) : (<span className='font-semibold'>{audio.id}/{audio.tracks.length}</span>)}
                                    <HeadphonesIcon size={25} weight={`${audio.id === null ? 'regular' : 'fill'}`}/>
                                </PlayerButton>

                                <PlayerButton className='flex gap-1 justify-center items-center' onClick={cycleSubtitles}>
                                    {subs.id === null ? (<></>) : (<span className='font-semibold'>{subs.id}/{subs.tracks.length}</span>)}
                                    <ClosedCaptioningIcon size={25} weight={`${subs.id === null ? 'regular' : 'fill'}`}/>
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
            )}
        </div>
    );
}

export default DesktopApp;