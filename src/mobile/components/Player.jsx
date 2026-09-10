import React, { useState, useEffect, useRef } from 'react';
import { VideoPlayer } from '../../shared/services/VideoEngine';
import { VideoEvents } from '../../shared/services/VideoEvents';
import { ArrowLeftIcon, FrameCornersIcon } from '@phosphor-icons/react';
import { formatTime } from '../../shared/utils/PlayerUtils';
import { useKeyboardShortcuts, useVideoState } from '../../desktop/hooks';
import { useWakeUI, useFullscreen, useDoubleTap } from '../../shared/hooks';
import { useScrubber } from '../../desktop/hooks/useScrubber';
import { LanguagePanel } from '../../desktop/components/LanguagePanel';
import { useWatchHistory } from '../../shared/contexts/WatchHistoryContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useLibraryStore } from '../../shared/store/useLibraryStore';
import { Maximize2Icon, Minimize2Icon, PauseIcon, PlayIcon, Volume1Icon, Volume2Icon, VolumeIcon, VolumeOffIcon, VolumeXIcon, RewindIcon, FastForwardIcon, Loader2, Sun } from 'lucide-react';
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
    const library = useLibraryStore(state => state.library);
    const media = library[tmdbId];

    const [activePath, setActivePath] = useState(null);
    const [centerIcon, setCenterIcon] = useState(() => PlayIcon);

    const leftAnim = useRef(null);
    const centerAnim = useRef(null);
    const rightAnim = useRef(null);

    const [showRemainingTime, setShowRemainingTime] = useState(true);
    const [languagePanelOpen, setLanguagePanelOpen] = useState(false);

    const [showVolumeBar, setShowVolumeBar] = useState(false);
    const [showBrightnessBar, setShowBrightnessBar] = useState(false);
    const [brightness, setBrightness] = useState(50);
    
    const pendingBrightDelta = useRef(0);
    const pendingVolDelta = useRef(0);

    const lastVolSent = useRef(0);
    const lastBrightSent = useRef(0);

    const [isOverviewActive, setIsOverviewActive] = useState(false);
    const [pauseFrameUrl, setPauseFrameUrl] = useState(null);
    const [scrubTime, setScrubTime] = useState(null);
    const [pendingSeek, setPendingSeek] = useState(null);

    const { isPlayerReady, isVideoLoaded, isPlaying, currentTime, duration, volume, isMute, subText, maxVolume, audio, subs, isBuffering, showBufferingSpinner, isFirstFrameRendered, isInitialLoadComplete } = useVideoState(activePath);
    const { isFullscreen, toggleFullscreen } = useFullscreen();
    const { showControls, wakeUI, hideUI, toggleUI, resetUITimerIfVisible, handleInteractiveEnter, handleInteractiveLeave } = useWakeUI({ holdOpen: languagePanelOpen });

    useEffect(() => {
        const init = async () => {
            try {
                const b = await VideoPlayer.getBrightness();
                setBrightness(b.brightness);
            } catch (e) {}
        };
        init();

        const handleBrightnessChange = (b) => {
            setBrightness(b);
        };
        VideoEvents.onBrightness.add(handleBrightnessChange);

        return () => {
            VideoEvents.onBrightness.delete(handleBrightnessChange);
            VideoPlayer.restoreBrightness().catch(() => {});
        };
    }, []);

    const { history, updateProgressAndSave, isLoaded: historyLoaded } = useWatchHistory(tmdbId);
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

    const hasLoaded = useRef(false);
    useEffect(() => {
        hasLoaded.current = false;
    }, [activePath]);

    useEffect(() => {
        if (isPlayerReady && activePath && historyLoaded && !hasLoaded.current) {
            let startPosition = 0;
            if (history) {
                startPosition = history.completed ? 0 : history.progress;
            }
            VideoPlayer.load(activePath, startPosition);
            hasLoaded.current = true;
        }
    }, [isPlayerReady, activePath, historyLoaded, history, tmdbId]);

    useEffect(() => {
        if (isVideoLoaded) {
            VideoPlayer.setPaused(false);
        }
    }, [isVideoLoaded]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('player-loading', { detail: { isLoading: !isInitialLoadComplete } }));
    }, [isInitialLoadComplete]);

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
            updateProgressAndSave(currentTime, duration, sessionId);
            lastSaveTime.current = timeNow;
        }
    }, [currentTime, duration, isScrubbing, tmdbId, sessionId]);

    useEffect(() => {
        return () => {
            if (latestTime.current > 0) {
                updateProgressAndSave(latestTime.current, duration, sessionId);
            }
        };
    }, [duration, tmdbId, sessionId]);



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
        resetUITimerIfVisible();
    }, toggleUI);

    const handleRightTap = useDoubleTap(() => {
        VideoPlayer.seek(10);
        rightAnim.current?.play();
        resetUITimerIfVisible();
    }, toggleUI);

    const handleCenterTap = useDoubleTap(togglePlay, wakeUI);

    const DRAG_SENSITIVITY_BRIGHTNESS = 500; // Lower number = more sensitive
    const DRAG_SENSITIVITY_VOLUME = 1200; // Higher number = less sensitive

    const bindLeft = useDrag(({ delta: [_, dy], active, last }) => {
        resetUITimerIfVisible();
        if (active) hideUI();
        const deltaPercent = -(dy / DRAG_SENSITIVITY_BRIGHTNESS) * 100; 
        pendingBrightDelta.current += deltaPercent;
        
        setShowBrightnessBar(active);
        
        const now = Date.now();
        if (now - lastBrightSent.current > 50 || last) {
            if (Math.abs(pendingBrightDelta.current) > 0.5) {
                VideoPlayer.addBrightness(pendingBrightDelta.current);
                pendingBrightDelta.current = 0;
                lastBrightSent.current = now;
            }
        }
    }, { filterTaps: true, axis: 'y', threshold: 15 });

    const bindRight = useDrag(({ delta: [_, dy], active, last }) => {
        resetUITimerIfVisible();
        if (active) hideUI();
        const deltaPercent = -(dy / DRAG_SENSITIVITY_VOLUME) * 100; 
        pendingVolDelta.current += deltaPercent;
        
        setShowVolumeBar(active);
        
        const now = Date.now();
        if (now - lastVolSent.current > 50 || last) {
            const percentPerStep = 100 / maxVolume;
            if (Math.abs(pendingVolDelta.current) >= percentPerStep) {
                const stepsToApply = Math.trunc(pendingVolDelta.current / percentPerStep);
                const percentToSend = stepsToApply * percentPerStep;
                
                VideoPlayer.addVolume(percentToSend);
                
                pendingVolDelta.current -= percentToSend;
                lastVolSent.current = now;
            }
        }
    }, { filterTaps: true, axis: 'y', threshold: 15 });

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

    let displayTime = currentTime;
    if (isScrubbing && scrubTime !== null) {
        displayTime = scrubTime;
    } else if (pendingSeek !== null) {
        displayTime = pendingSeek;
    }

    const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

    console.log(`Debug stuffs: ${isPlaying} ${isPlayerReady} ${isVideoLoaded}`);
    
    return (
        <div className='w-screen h-screen relative overflow-hidden flex flex-col items-center justify-center'>
            {/* <img className={`absolute w-full scale-105 max-h-full object-contain blur-lg ${isOverviewActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}
                src={pauseFrameUrl} onLoad={() => setIsOverviewActive(true)} /> */}

            <div className='relative w-full flex-1 flex items-center flex-col justify-between noselect text-white'>

                {!isInitialLoadComplete && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500">
                        <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                        <span className="text-white text-lg font-semibold tracking-wider">Loading {media?.title}...</span>
                    </div>
                )}
                {isInitialLoadComplete && showBufferingSpinner && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300">
                        <div className="bg-black/60 p-4 rounded-full">
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                        </div>
                    </div>
                )}

                <div className={`relative z-30 w-full pt-6 px-6 flex flex-row justify-start items-center gap-2 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200`}>
                    <PlayerButton onClick={exitPlayer} onTouchStart={handleInteractiveEnter} onTouchEnd={handleInteractiveLeave}>
                        <ArrowLeftIcon size={25} weight='bold' />
                    </PlayerButton>

                    <span className='absolute top-7 -z-10 inset-0 text-xl tracking-wide text-body flex-1 text-center'>{media.title}</span>
                </div>

                <div className="absolute inset-0 flex z-10">
                    <div className='bg-transparent flex-1 h-full' style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()} {...bindLeft()} onClick={handleLeftTap} />
                    
                    <div className='bg-transparent flex-1 h-full' style={{ touchAction: 'none' }} onClick={handleCenterTap} />
                    
                    <div className='bg-transparent flex-1 h-full' style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()} {...bindRight()} onClick={handleRightTap} />

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

                <div className={`absolute z-20 left-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 transition-opacity duration-300 pointer-events-none ${showVolumeBar ? 'opacity-100' : 'opacity-0'}`}>
                    <Volume2Icon size={24} className="text-white drop-shadow-md" />
                    <div className="w-2 h-48 bg-white/20 rounded-full flex items-end overflow-hidden">
                        <div className="w-full bg-white rounded-full transition-all duration-75" style={{ height: `${volume}%` }} />
                    </div>
                    <span className="text-white font-semibold text-sm drop-shadow-md w-8 text-center">{Math.round((volume / 100) * 15)}</span>
                </div>

                <div className={`absolute z-20 right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 transition-opacity duration-300 pointer-events-none ${showBrightnessBar ? 'opacity-100' : 'opacity-0'}`}>
                    <Sun size={24} className="text-white drop-shadow-md" />
                    <div className="w-2 h-48 bg-white/20 rounded-full flex items-end overflow-hidden">
                        <div className="w-full bg-white rounded-full transition-all duration-75" style={{ height: `${brightness}%` }} />
                    </div>
                    <span className="text-white font-semibold text-sm drop-shadow-md w-8 text-center">{Math.round(brightness)}%</span>
                </div>

                <div className='absolute -z-10 bottom-20 inset-x-0 h-16 flex items-center justify-center text-white text-shadow-md text-shadow-black/30 tracking-wide text-xl text-center'>
                    {subText ?? ''}
                </div>

                <div className={`w-full bg-[linear-gradient(to_top,rgba(0,0,0,0.5)_30%,transparent_100%),radial-gradient(6000px_circle_at_50%_6000px,rgba(0,0,0,.85)_99%,transparent_100%)]
                    flex flex-col justify-center items-stretch relative z-30 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200`} onTouchStart={handleInteractiveEnter} onTouchEnd={handleInteractiveLeave}>

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
