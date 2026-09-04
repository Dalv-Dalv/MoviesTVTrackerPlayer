import React, { useState, useEffect, useRef } from 'react';
import { VideoPlayer } from '../../shared/services/VideoEngine';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { formatTime } from '../../shared/utils/PlayerUtils';
import { useKeyboardShortcuts, useVideoState } from '../hooks';
import { useWakeUI, useFullscreen } from '../../shared/hooks';
import { useScrubber } from '../hooks/useScrubber';
import { LanguagePanel } from './LanguagePanel';
import { useWatchHistory } from '../../shared/contexts/WatchHistoryContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useVideoLibrary } from '../../shared/contexts/VideoLibraryContext';
import { Maximize2Icon, Minimize2Icon, PauseIcon, PlayIcon, Volume1Icon, Volume2Icon, VolumeIcon, VolumeOffIcon, VolumeXIcon, Loader2 } from 'lucide-react';

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

    const [showRemainingTime, setShowRemainingTime] = useState(true);
    const [languagePanelOpen, setLanguagePanelOpen] = useState(false);

    const [isOverviewActive, setIsOverviewActive] = useState(false);
    const [pauseFrameUrl, setPauseFrameUrl] = useState(null);
    const [scrubTime, setScrubTime] = useState(null);
    const [pendingSeek, setPendingSeek] = useState(null);
    const [hoverRatio, setHoverRatio] = useState(null);

    const { isPlayerReady, isVideoLoaded, isPlaying, currentTime, duration, volume, isMute, subText, maxVolume, audio, subs, isBuffering, showBufferingSpinner, isFirstFrameRendered, isInitialLoadComplete } = useVideoState(activePath);
    const { isFullscreen, toggleFullscreen } = useFullscreen();
    const { showControls, wakeUI, handleInteractiveEnter, handleInteractiveLeave } = useWakeUI({ holdOpen: languagePanelOpen });

    const { history, updateProgressAndSave, isLoaded: historyLoaded } = useWatchHistory(tmdbId);
    const sessionId = useRef(Date.now()).current;
    const lastSaveTime = useRef(0);
    const latestTime = useRef(0);

    useEffect(() => {
        setActivePath(media.filePaths[0]);
        console.log(media.filePaths[0]);
    }, []);

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
            VideoPlayer.seekToPercentage(parseFloat((ratio * 100).toFixed(5)));
        },
        onScrubEnd: (ratio) => {
            if (duration === 0) return;
            const finalTime = ratio * duration;
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

    const handleProgressMouseMove = (e) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        let ratio = (e.clientX - rect.left) / rect.width;
        ratio = Math.max(0, Math.min(1, ratio));
        setHoverRatio(ratio);
    };

    const handleProgressMouseLeave = () => {
        setHoverRatio(null);
    };

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



    const togglePlay = () => VideoPlayer.playPause();
    const toggleMute = () => VideoPlayer.toggleMute();
    const setVolume = (vol) => VideoPlayer.setVolume(vol);

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

    const tooltipTime = hoverRatio !== null && !isScrubbing ? hoverRatio * duration : displayTime;
    const tooltipProgress = hoverRatio !== null && !isScrubbing ? hoverRatio * 100 : progress;

    useKeyboardShortcuts({ togglePlay, toggleFullscreen, toggleMute });

    return (
        <div className='w-screen h-screen relative overflow-hidden flex flex-col items-center justify-center'>
            {/* <img className={`absolute w-full scale-105 max-h-full object-contain blur-lg ${isOverviewActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}
                src={pauseFrameUrl} onLoad={() => setIsOverviewActive(true)} /> */}

            <div className='relative w-full flex-1 flex items-center flex-col justify-between noselect text-white' onMouseMove={wakeUI}>

                <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${isInitialLoadComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                    <span className="text-white text-lg font-semibold tracking-wider">Loading {media?.title}...</span>
                </div>
                {isInitialLoadComplete && showBufferingSpinner && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300">
                        <div className="bg-black/60 p-4 rounded-full">
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                        </div>
                    </div>
                )}

                <div className={`relative w-full pt-6 px-6 flex flex-row justify-start items-center gap-2 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
                    <PlayerButton onClick={exitPlayer} onMouseEnter={handleInteractiveEnter} onMouseLeave={handleInteractiveLeave}>
                        <ArrowLeftIcon size={25} weight='bold' />
                    </PlayerButton>

                    <span className='absolute top-7 -z-10 inset-0 text-xl tracking-wide text-body flex-1 text-center'>{media.title}</span>
                </div>

                <div className={`relative w-full flex-1 bg-transparent ${showControls ? 'cursor-default' : 'cursor-none'}`} onClick={togglePlay} onDoubleClick={(e) => toggleFullscreen()} />

                <div className='absolute -z-10 bottom-20 inset-x-0 h-16 flex items-center justify-center text-white text-shadow-md text-shadow-black/30 tracking-wide text-xl text-center font-subtitles'>
                    {subText ?? ''}
                </div>

                <div className={`w-full bg-[linear-gradient(to_top,rgba(0,0,0,0.5)_30%,transparent_100%),radial-gradient(6000px_circle_at_50%_6000px,rgba(0,0,0,.85)_99%,transparent_100%)]
                    flex flex-col justify-center items-stretch ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} onMouseEnter={handleInteractiveEnter} onMouseLeave={handleInteractiveLeave}>

                    <div ref={progressBarRef} className='relative mx-4 py-2 group cursor-pointer' onMouseDown={onProgressMouseDown} onTouchStart={onProgressTouchStart} onMouseMove={handleProgressMouseMove} onMouseLeave={handleProgressMouseLeave}>
                        <div className='relative flex-1 h-1 group-hover:h-1.5 transition-[height] duration-100'>
                            <div className='absolute inset-0 bg-white/20 border rounded-full group-hover:bg-white/40 transition-colors duration-100 border-white/10 group-hover:border-white/30' />
                            <div className='absolute inset-0 bg-red-500 border rounded-full border-white/20 flex items-center' style={{ width: `${progress}%` }}>
                                <div className={`absolute bg-red-500 border border-white/20 rounded-full w-3 h-3 -right-1.5 transition-transform scale-0 ${isScrubbing ? 'scale-100' : ''} flex items-center duration-200`}>
                                </div>
                            </div>
                            <span className={`bg-black/40 absolute text-center bottom-4 py-1 px-3 whitespace-nowrap rounded-sm opacity-0 group-hover:opacity-100 ${isScrubbing ? 'opacity-100' : ''} transition-opacity duration-100 pointer-events-none`}
                                style={{ left: `clamp(2rem, ${tooltipProgress}%, calc(100% - 2rem))`, transform: 'translateX(-50%)' }}>
                                {formatTime(tooltipTime)}
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

                            <PlayerButton className='flex group p-0!'>
                                <div onClick={toggleMute} className='p-1.5'>
                                    {isMute ? (
                                        <VolumeOffIcon size={25} />
                                    ) : volume === 0 ? (
                                        <VolumeXIcon size={25} />
                                    ) : volumeProgress < 50 ? (
                                        <Volume1Icon size={25} />
                                    ) : (
                                        <Volume2Icon size={25} />
                                    )}
                                </div>

                                <div className='flex justify-between items-center w-0 flex-1 group-hover:w-46 transition-[width] duration-200 overflow-hidden rounded-r-full pr-0 group-hover:pr-1.5'>
                                    <div ref={volumeBarRef} onMouseDown={onVolumeMouseDown} onTouchStart={onVolumeTouchStart} className='h-1 bg-white/20 w-32 ml-1 rounded-full mr-1 overflow-hidden'>
                                        <div className='bg-white h-full rounded-full' style={{ width: `${volumeProgress}%` }} />
                                    </div>

                                    <span className='font-semibold ml-1'>{Math.floor(volume)}%</span>
                                </div>
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
                                {isFullscreen ? (
                                    <Minimize2Icon size={22} />
                                ) : (
                                    <Maximize2Icon size={22} />
                                )}
                            </PlayerButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
