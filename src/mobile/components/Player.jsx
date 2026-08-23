import React, { useState, useEffect, useRef } from 'react';
import { VideoPlayer } from '../../shared/services/VideoEngine';
import { ArrowLeftIcon, FrameCornersIcon } from '@phosphor-icons/react';
import { formatTime } from '../../shared/utils/PlayerUtils';
import { useKeyboardShortcuts, useVideoState } from '../../desktop/hooks';
import { useWakeUI, useFullscreen, useDoubleTap } from '../../shared/hooks';
import { useScrubber } from '../../desktop/hooks/useScrubber';
import { LanguagePanel } from '../../desktop/components/LanguagePanel';
import { useWatchHistory } from '../../shared/contexts/WatchHistoryContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useVideoLibrary } from '../../shared/contexts/VideoLibraryContext';
import { Maximize2Icon, Minimize2Icon, PauseIcon, PlayIcon, Volume1Icon, Volume2Icon, VolumeIcon, VolumeOffIcon, VolumeXIcon, RewindIcon, FastForwardIcon } from 'lucide-react';
import { Animated } from './Animated';
import { useDrag } from '@use-gesture/react';

export const PlayerButton = ({ children, onClick, className = '', ...props }) => {
    return (
        <button tabIndex={-1} className={`bg-black/10 hover:bg-black/40 p-1.5 rounded-sm transition-colors duration-200 ${className}`}
            onClick={onClick}
            {...props}>

            {children}
        </button>
    );
}

export const Player = () => {
    const { tmdbId } = useParams();
    const navigate = useNavigate();
    const { library } = useVideoLibrary();
    const media = library[tmdbId];

    const [activePath, setActivePath] = useState(null);
    const [centerIcon, setCenterIcon] = useState(() => PlayIcon);

    const leftAnim = useRef(null);
    const centerAnim = useRef(null);
    const rightAnim = useRef(null);

    const [showRemainingTime, setShowRemainingTime] = useState(true);
    const [languagePanelOpen, setLanguagePanelOpen] = useState(false);

    const [isOverviewActive, setIsOverviewActive] = useState(false);
    const [pauseFrameUrl, setPauseFrameUrl] = useState(null);
    const [scrubTime, setScrubTime] = useState(null);
    const [pendingSeek, setPendingSeek] = useState(null);

    const { isPlayerReady, isVideoLoaded, isPlaying, currentTime, duration, volume, isMute, subText, maxVolume, audio, subs } = useVideoState(activePath);
    const { isFullscreen, toggleFullscreen } = useFullscreen();
    const { showControls, wakeUI, handleInteractiveEnter, handleInteractiveLeave } = useWakeUI({ holdOpen: languagePanelOpen });

    const { history, updateProgressAndSave, isLoaded: historyLoaded } = useWatchHistory();
    const sessionId = useRef(Date.now()).current;
    const lastSaveTime = useRef(0);
    const latestTime = useRef(0);

    useEffect(() => {
        setActivePath(media.filePaths[0]);
        console.log(media.filePaths[0]);
    }, []);

    useEffect(() => {
        window.__android_immersive_state = true;
        toggleFullscreen(true);

        return () => {
            window.__android_immersive_state = false;
            toggleFullscreen(false);
        };
    }, [toggleFullscreen]);

    useEffect(() => {
        if (isPlayerReady && activePath) {
            VideoPlayer.load(activePath);
        }
    }, [isPlayerReady, activePath]);

    useEffect(() => {
        if (isVideoLoaded) {
            VideoPlayer.setPaused(false);
        }
    }, [isVideoLoaded]);

    const {
        trackRef: progressBarRef,
        isScrubbing,
        onMouseDown: onProgressMouseDown,
        onTouchStart: onProgressTouchStart
    } = useScrubber({
        orientation: 'horizontal',
        onChange: (ratio) => {
            if (duration === 0) return;
            setScrubTime(ratio * duration);
            setPendingSeek(null);
        },
        onScrubEnd: (ratio) => {
            if (duration === 0) return;
            const finalTime = ratio * duration;
            VideoPlayer.seekToPercentage(parseFloat((ratio * 100).toFixed(5)));
            setScrubTime(null);
            setPendingSeek(finalTime);

            setTimeout(() => {
                setPendingSeek(prev => prev === finalTime ? null : prev);
            }, 1000);
        }
    });

    useEffect(() => {
        if (pendingSeek !== null && Math.abs(currentTime - pendingSeek) < 3) {
            setPendingSeek(null);
        }
    }, [currentTime, pendingSeek]);

    useEffect(() => {
        let timeout;
        async function getAndSetFrame() {
            const frameUrl = await VideoPlayer.captureFrame();
            if (frameUrl) setPauseFrameUrl(frameUrl);
        }

        if (isPlaying || isScrubbing) {
            setIsOverviewActive(false);
        } else {
            timeout = setTimeout(getAndSetFrame, 15000);
        }

        return () => clearTimeout(timeout);
    }, [isPlaying, isScrubbing, showControls]);

    useEffect(() => {
        latestTime.current = currentTime;

        if (duration === 0 || isScrubbing) return;

        const timeNow = Date.now();

        if (timeNow - lastSaveTime.current >= 10000) {
            updateProgressAndSave(tmdbId, currentTime, duration, sessionId);
            lastSaveTime.current = timeNow;
        }
    }, [currentTime, duration, isScrubbing, tmdbId, sessionId]);

    useEffect(() => {
        return () => {
            if (latestTime.current > 0) {
                updateProgressAndSave(tmdbId, latestTime.current, duration, sessionId);
            }
        };
    }, [duration, tmdbId, sessionId]);

    const hasResumed = useRef(false);
    useEffect(() => {
        hasResumed.current = false;
    }, [activePath]);

    useEffect(() => {
        if (!historyLoaded || !isVideoLoaded || hasResumed.current) return;

        const movieHistory = history[tmdbId];
        let startPosition = 0;

        if (movieHistory) {
            startPosition = movieHistory.completed ? 0 : movieHistory.progress;
        }

        if (startPosition > 0) {
            VideoPlayer.seekTo(startPosition);
        }

        hasResumed.current = true;
    }, [historyLoaded, isVideoLoaded, history, tmdbId]);

    const togglePlay = () => {
        const willPlay = !isPlaying;
        VideoPlayer.playPause();
        setCenterIcon(willPlay ? PlayIcon : PauseIcon);
        centerAnim.current?.play();
    };
    const toggleMute = () => VideoPlayer.toggleMute();
    const setVolume = (vol) => VideoPlayer.setVolume(vol);

    const handleLeftTap = useDoubleTap(() => {
        VideoPlayer.seek(-10);
        leftAnim.current?.play();
    }, wakeUI);

    const handleRightTap = useDoubleTap(() => {
        VideoPlayer.seek(10);
        rightAnim.current?.play();
    }, wakeUI);

    const handleCenterTap = useDoubleTap(togglePlay, wakeUI);

    const bindLeft = useDrag(({ movement: [_, my], memo, first }) => {
        const delta = -(my / 300); 
        VideoPlayer.addVolume(delta);
        //TODO: Brightness
    });
    const bindRight = useDrag(({ movement: [_, my], memo, first }) => {
        const delta = -(my / 300); 
        VideoPlayer.addVolume(delta);
    });

    useEffect(() => {
        return () => {
            VideoPlayer.stop();
        };
    }, []);

    const exitPlayer = () => {
        navigate(-1);
    };

    const {
        trackRef: volumeBarRef,
        onMouseDown: onVolumeMouseDown,
        onTouchStart: onVolumeTouchStart
    } = useScrubber({
        orientation: 'horizontal',
        onChange: (ratio) => {
            const newVolume = ratio * maxVolume;
            setVolume(newVolume);
            VideoPlayer.setVolume(newVolume);
        }
    });

    const volumeProgress = (volume / maxVolume) * 100;

    const displayTime = isScrubbing && scrubTime !== null
        ? scrubTime
        : pendingSeek !== null
            ? pendingSeek
            : currentTime;

    const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

    return (
        <div className='w-screen h-screen relative overflow-hidden flex flex-col items-center justify-center'>
            {/* <img className={`absolute w-full scale-105 max-h-full object-contain blur-lg ${isOverviewActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}
                src={pauseFrameUrl} onLoad={() => setIsOverviewActive(true)} /> */}

            <div className='relative w-full flex-1 flex items-center flex-col justify-between noselect text-white'>

                <div className={`relative z-10 w-full pt-6 px-6 flex flex-row justify-start items-center gap-2 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
                    <PlayerButton onClick={exitPlayer} onTouchStart={handleInteractiveEnter} onTouchEnd={handleInteractiveLeave}>
                        <ArrowLeftIcon size={25} weight='bold' />
                    </PlayerButton>

                    <span className='absolute top-7 -z-10 inset-0 text-xl tracking-wide text-body flex-1 text-center'>{media.title}</span>
                </div>

                <div className='absolute z-0 inset-0 flex justify-center items-center' >
                    <div className='bg-transparent flex-1 h-full' onClick={handleLeftTap} />
                    <div className='bg-transparent flex-1 h-full' onClick={handleCenterTap} />
                    <div className='bg-transparent flex-1 h-full' {...bindRight()} onClick={handleRightTap} />

                    <Animated ref={leftAnim}>
                        <div className="absolute w-1/3 h-full left-0 bg-linear-to-r from-white/10 to-transparent origin-left animate-ripple" />
                    </Animated>

                    <Animated ref={centerAnim}>
                        <div className="absolute animate-fade-icon text-white bg-black/40 rounded-full p-4 flex items-center justify-center z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            {centerIcon === PlayIcon ? <PlayIcon size={35} fill="white" /> : <PauseIcon size={35} fill="white" />}
                        </div>
                    </Animated>

                    <Animated ref={rightAnim}>
                        <div className="absolute w-1/3 h-full right-0 bg-linear-to-l from-white/10 to-transparent origin-right animate-ripple" />
                    </Animated>
                </div>

                <div className='absolute -z-10 bottom-20 inset-x-0 h-16 flex items-center justify-center text-white text-shadow-md text-shadow-black/30 tracking-wide text-xl text-center'>
                    {subText ?? ''}
                </div>

                <div className={`w-full bg-[linear-gradient(to_top,rgba(0,0,0,0.5)_30%,transparent_100%),radial-gradient(6000px_circle_at_50%_6000px,rgba(0,0,0,.85)_99%,transparent_100%)]
                    flex flex-col justify-center items-stretch relative z-10 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} onTouchStart={handleInteractiveEnter} onTouchEnd={handleInteractiveLeave}>

                    <div ref={progressBarRef} className='relative mx-4 py-2 group cursor-pointer' onMouseDown={onProgressMouseDown} onTouchStart={onProgressTouchStart}>
                        <div className={`relative flex-1 transition-[height] duration-100 ${isScrubbing ? 'h-2' : 'h-1.5'}`}>
                            <div className='absolute inset-0 bg-white/10 border rounded-full group-hover:bg-white/20 transition-colors duration-100 border-white/10 group-hover:border-white/30' />
                            <div className='absolute inset-0 bg-red-500 border rounded-full border-white/10 flex items-center' style={{ width: `${progress}%` }}>
                                <div className={`absolute bg-red-500 border border-white/10 rounded-full w-3 h-3 -right-1.5 transition-transform scale-0 ${isScrubbing ? 'scale-100' : ''} flex items-center duration-200`}>
                                </div>
                            </div>
                            <span className={`bg-black/20 absolute text-center bottom-12 py-1 px-3 whitespace-nowrap rounded-sm opacity-0 ${isScrubbing ? 'opacity-100' : ''} transition-opacity duration-100 pointer-events-none`}
                                style={{ left: `clamp(2rem, ${progress}%, calc(100% - 2rem))`, transform: 'translateX(-50%)' }}>
                                {formatTime(displayTime)}
                            </span>
                        </div>
                    </div>

                    <div className='px-6 pb-4 pt-1 flex justify-between items-center'>
                        <div className='flex justify-between items-center gap-2'>
                            <PlayerButton onClick={togglePlay}>
                                {isPlaying ? (
                                    <PauseIcon size={25} fill='white' />
                                ) : (
                                    <PlayIcon size={25} fill='white' />
                                )}
                            </PlayerButton>

                            <span className='font-semibold bg-black/10 px-3 py-1.5 rounded-sm tracking-wide'>
                                {formatTime(displayTime)}
                            </span>
                        </div>

                        <div className='flex justify-between items-center gap-2'>
                            <PlayerButton className='font-semibold px-3 py-1.5 tracking-wide' onClick={() => setShowRemainingTime(prev => !prev)}>
                                {showRemainingTime ? `-${formatTime(duration - displayTime)}` : formatTime(duration)}
                            </PlayerButton>

                            <LanguagePanel isOpen={languagePanelOpen} setIsOpen={setLanguagePanelOpen} />

                            <PlayerButton onClick={(e) => toggleFullscreen()}>
                                <FrameCornersIcon size={26}/>
                            </PlayerButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
