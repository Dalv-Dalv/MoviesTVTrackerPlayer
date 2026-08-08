import React, { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { VideoPlayer } from '../shared/VideoEngine';
import { Player } from './Player';
import { handleScanLibrary } from './hooks/useFolderScanner';
import { useVideoLibrary } from '../shared/VideoLibraryContext';
import { Poster } from '../shared/Poster';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { Carousel } from '../shared/Carousel';

function DesktopApp() {
    const { mediaItems, isScanning, rescanLibrary, addFolderAndScan } = useVideoLibrary();

    const [hasVideo, setHasVideo] = useState(false);

    const [isSpinning, setIsSpinning] = useState(false);
    useEffect(() => {
        if (isScanning) {
            setIsSpinning(true);
        }
    }, [isScanning]);
    const handleAnimationIteration = () => {
        if (!isScanning) {
            setIsSpinning(false);
        }
    };

    console.log(mediaItems);

    return (
        <div className={`h-screen w-screen transition-colors duration-500 ${hasVideo ? 'bg-transparent' : 'bg-background'} overflow-hidden`}>
            {!hasVideo ? (
                <>
                    {/* <div className="flex items-center justify-center gap-4">
                        <button onClick={handleScanLibrary} className="bg-black text-white px-8 py-3 rounded-lg font-bold text-lg">
                            Load Movie
                        </button>

                        <button 
                            onClick={addFolderAndScan} 
                            className="bg-emerald-500 text-black px-4 py-2 rounded font-bold"
                        >
                            + Add Folder
                        </button>

                        <button 
                            onClick={rescanLibrary} 
                            disabled={isScanning}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold"
                        >
                            {isScanning ? "Scanning..." : "Refresh Library"}
                        </button>
                    </div> */}
                    <div className='px-6 mt-20 text-body -mb-6 flex flex-row gap-4 items-center justify-between noselect relative z-30'>
                        <span className='font-bold text-2xl'>
                            Library
                        </span>

                        <button 
                            onClick={rescanLibrary} 
                            disabled={isScanning || isSpinning} 
                            className='flex flex-row items-center gap-2 text-muted transition-colors duration-100 hover:text-body hover:bg-divider pl-1.5 pr-3 -mr-4 py-1 rounded-full disabled:bg-transparent disabled:text-muted/60'
                        >
                            <ArrowClockwiseIcon 
                                size={20} 
                                className={`inline ${isSpinning ? 'animate-spin duration-100' : ''}`}
                                onAnimationIteration={handleAnimationIteration}
                                style={{
                                    animationDuration: '750ms', 
                                    animationTimingFunction: 'ease-in-out' 
                                }}
                            />
                            <span>Refresh</span>
                        </button>
                    </div>
                    <div className='w-full noselect'>
                        <Carousel>
                            {mediaItems.map((elem) => (
                                <div
                                    className='group cursor-pointer relative w-[25vw] max-w-70 shrink-0 transition-transform duration-200 hover:scale-[1.02] transform-gpu will-change-transform snap-start' 
                                    key={elem.tmdbId}
                                >
                                    <Poster 
                                        relativePath={elem.posterPath} 
                                        altText={elem.title} 
                                        className='absolute inset-0 blur-md opacity-0 transition-opacity duration-200 group-hover:opacity-100'
                                    />

                                    <div className="relative z-10 rounded-lg overflow-hidden shadow-md shadow-black/50 bg-neutral-900">       
                                        <Poster 
                                            relativePath={elem.posterPath} 
                                            altText={elem.title} 
                                            className='w-full h-full block'
                                        />
                                        
                                        <div className="absolute rounded-lg inset-0 ring-2 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light"/>
                                        <div className="absolute rounded-lg inset-0 ring-2 ring-inset ring-white/8 pointer-events-none"/>
                                    </div>
                                </div>
                            ))}
                        </Carousel>
                    </div>
                </>
            ) : (
                <Player />
            )}
        </div>
    );
}

export default DesktopApp;