import React, { useState, useRef, useEffect } from 'react';
import { ChatDotsIcon, ClosedCaptioningIcon } from '@phosphor-icons/react';
import { formatLanguage } from '../shared/PlayerUtils';
import { useVideoState } from './hooks/';
import { PlayerButton } from './DesktopApp';
import { VideoPlayer } from '../shared/VideoEngine';

const AnimatedHeight = ({ isOpen, children, className = '' }) => {
    const contentRef = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (!contentRef.current) return;

        const observer = new ResizeObserver((entries) => {
            if (isOpen) {
                setHeight(entries[0].contentRect.height);
            }
        });

        observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) setHeight(0);
        else if (contentRef.current) setHeight(contentRef.current.getBoundingClientRect().height);
    }, [isOpen]);

    return (
        <div style={{ height }} className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${className}`}>
            <div ref={contentRef} className="flex flex-col">
                {children}
            </div>
        </div>
    );
};

export const LanguageListElement = ({ selected = false, children, className = '', onClick, ...props }) => {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 mx-1 hover:text-white transition-[padding-left,color,background-color] duration-100 rounded-sm text-left ${selected ? 'bg-red-500/20 pl-6 hover:bg-red-500/30 text-white/90 font-semibold' : 'hover:bg-white/3 text-white/80'} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export const LanguagePanel = ({ isOpen, setIsOpen }) => {
    const { audio, subs } = useVideoState();
    const [languagePanelTab, setLanguagePanelTab] = useState(1);
    const languagePanelRef = useRef(null);

    const setSubtitles = (id) => VideoPlayer.setSubtitleTrack(id);
    const setAudioTrack = (id) => VideoPlayer.setAudioTrack(id);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (languagePanelRef.current && !languagePanelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, setIsOpen]);

    return (
        <div className='relative' ref={languagePanelRef}>
            <PlayerButton onClick={(e) => setIsOpen(!isOpen)} className='relative z-20'>
                <ChatDotsIcon size={25} weight={`${isOpen ? 'fill' : 'regular'}`} />
            </PlayerButton>

            <AnimatedHeight isOpen={isOpen} className='absolute bottom-0 right-0 bg-linear-to-b from-black/60 to-black z-15 min-w-70 rounded-lg rounded-br-sm flex flex-col shadow-xl shadow-black/70'>
                <div className='grid grid-cols-2'>
                    <div className={`text-center p-1 pt-4 pb-0 font-semibold transition-colors duration-200 cursor-pointer ${languagePanelTab === 0 ? 'text-white/90' : 'text-white/20'}`} onClick={(e) => { setLanguagePanelTab(0) }}>
                        Audio
                    </div>
                    <div className={`text-center p-1 pt-4 pb-0 font-semibold transition-colors duration-200 cursor-pointer ${languagePanelTab === 1 ? 'text-white/90' : 'text-white/20'}`} onClick={(e) => { setLanguagePanelTab(1) }}>
                        Subtitles
                    </div>
                </div>

                <div className='flex flex-col max-h-[50vh] overflow-y-scroll no-scrollbar pb-20 pt-4'
                    style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 70%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 70%, transparent 100%)' }}>
                    <div key={languagePanelTab} className={`flex flex-col gap-1 transition-all duration-300 opacity-100 translate-x-0 starting:opacity-0 ${languagePanelTab === 0 ? 'starting:-translate-x-2' : 'starting:translate-x-2'}`}>
                        {languagePanelTab === 0 ? (
                            audio.tracks.map(elem => {
                                const hasDuplicateLang = audio.tracks.filter(t => t.lang === elem.lang).length > 1;
                                return (
                                    <LanguageListElement key={elem.id} selected={elem.selected} onClick={(e) => VideoPlayer.setAudioTrack(elem.id)} className='flex items-center justify-between gap-4'>
                                        <span>{formatLanguage(elem.lang)}</span>
                                        {hasDuplicateLang && (elem.title || elem.codec) && (
                                            <span className="text-[11px] uppercase tracking-wider opacity-60 font-normal truncate max-w-28 text-right">
                                                {elem.codec}
                                            </span>
                                        )}
                                    </LanguageListElement>
                                );
                            })
                        ) : (
                            <>
                                <LanguageListElement key="off" selected={!subs.tracks.some(track => track.selected)} onClick={(e) => VideoPlayer.setSubtitleTrack(0)}>
                                    Off
                                </LanguageListElement>

                                {subs.tracks.map(elem => (
                                    <LanguageListElement key={elem.id} selected={elem.selected} onClick={(e) => VideoPlayer.setSubtitleTrack(elem.id)} className='flex items-center'>
                                        {formatLanguage(elem.lang)}
                                        {elem['hearing-impaired'] && (
                                            <ClosedCaptioningIcon size={25} className='ml-2' weight={`${elem.selected ? 'fill' : 'regular'}`}/>
                                        )}
                                    </LanguageListElement>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </AnimatedHeight>
        </div>
    );
};
