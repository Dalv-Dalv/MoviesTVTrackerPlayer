import React, { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { VideoPlayer } from '../shared/VideoEngine';
import { Player } from './Player';
import { handleScanLibrary } from './hooks/useFolderScanner';
import { useVideoLibrary } from '../shared/VideoLibraryContext';
import { MovieImage } from '../shared/Poster';
import { ArrowClockwiseIcon, GearIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Carousel } from '../shared/Carousel';
import { WindowTitlebar } from './WindowTitlebar';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaDetails } from '../shared/MediaDetails';
import { useNavigate } from 'react-router-dom';

function NavbarButton({ children, className = '' }) {
    return (
        <div className={`relative overflow-hidden h-full p-2 group rounded-full text-body/50 ring-1 ring-inset ring-white/5 hover:ring-white/10 transition-colors duration-300 pointer-events-auto ${className}`}>
            <div className="absolute -inset-8 bg-divider/20 group-hover:bg-divider/50 backdrop-blur-lg transition-colors duration-200 -z-10"></div>

            {children}
        </div>
    );
}

function DesktopApp() {
    const { library, isScanning, rescanLibrary, addFolderAndScan } = useVideoLibrary();
    const mediaItems = Object.values(library);

    const navigate = useNavigate();

    const [hasVideo, setHasVideo] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);

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
        <div className={`h-screen w-screen relative overflow-hidden transition-colors duration-500 ${hasVideo ? 'bg-transparent' : 'bg-background'}`}>
            <WindowTitlebar />

            {!hasVideo && (
                <div className={`absolute top-5 z-20 w-full flex items-center justify-between p-4 py-0 noselect gap-2 h-12 pointer-events-none`}>
                    <NavbarButton className='flex gap-2 px-4'>
                        <button className="relative">Library</button>
                        <button className="relative">Explore</button>
                    </NavbarButton>

                    <NavbarButton className='flex gap-2 px-4'>
                        <button className="relative">Movies</button>
                        <button className="relative">Shows</button>
                    </NavbarButton>

                    <NavbarButton className='flex-1 p-2 group flex items-center justify-center'>
                        <MagnifyingGlassIcon size={28} className='relative text-body/50 transition-colors duration-200 group-hover:text-body/80' />
                        <div className='flex-1'>

                        </div>
                    </NavbarButton>

                    <NavbarButton className='aspect-square flex items-center justify-center'>
                        <div className="absolute -inset-8 bg-divider/20 group-hover:bg-divider/50 backdrop-blur-lg transition-colors duration-200 -z-10"></div>

                        <GearIcon size={28} className='relative text-body/50 transition-colors duration-200 group-hover:text-body/80' />
                    </NavbarButton>
                </div>
            )}

            <div className="h-full w-full overflow-y-auto noScrollbar">
                {!hasVideo ? (
                    <>
                        {/* <div className="flex items-center justify-center gap-4 mt-20">
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
                        {mediaItems[4] && (
                            <div className='relative w-full flex items-center justify-center p-6 overflow-hidden pb-25 pt-24 -mb-25'>
                                <MovieImage relativePath={mediaItems[4].backdropPath} altText={mediaItems[1].title}
                                    className='absolute inset-0 scale-110 transform-gpu blur-lg mask-[linear-gradient(to_bottom,black,transparent)] opacity-75' />

                                <div className='relative w-3/4 rounded-2xl overflow-hidden'>
                                    <MovieImage relativePath={mediaItems[4].backdropPath} altText={mediaItems[1].title}
                                        className='w-full' />

                                    <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                                    <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/8 pointer-events-none" />

                                    <MovieImage relativePath={mediaItems[4].logoPath} altText={mediaItems[1].title}
                                        className='absolute left-[3vw] bottom-[3vw] w-100 max-w-1/2' />
                                </div>
                            </div>
                        )}


                        <div className='px-6 mt-20 text-body -mb-6 flex flex-row gap-4 items-center justify-between noselect relative z-10'>
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
                        <div className='w-full noselect mb-100'>
                            <Carousel>
                                {mediaItems.map((elem) => (
                                    <div
                                        onClick={() => navigate(`/details/${elem.tmdbId}`)}
                                        className='group cursor-pointer relative w-[25vw] max-w-70 shrink-0 aspect-2/3 snap-start transform-gpu will-change-transform transition-transform duration-300 hover:scale-[1.02]'
                                        key={elem.tmdbId}
                                    >
                                        <div className="relative w-full h-full">
                                            <MovieImage
                                                relativePath={elem.posterPath}
                                                altText={elem.title}
                                                className='absolute inset-0 blur-md opacity-0 transition-opacity duration-200 group-hover:opacity-100'
                                            />

                                            <div className="relative z-10 w-full h-full rounded-lg overflow-hidden shadow-md shadow-black/50 bg-neutral-900">
                                                <MovieImage
                                                    relativePath={elem.posterPath}
                                                    altText={elem.title}
                                                    className='w-full h-full object-cover block'
                                                />
                                                <div className="absolute rounded-lg inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                                                <div className="absolute rounded-lg inset-0 ring-1 ring-inset ring-white/8 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Carousel>
                        </div>
                        <AnimatePresence>
                            {selectedMedia && (
                                <MediaDetails media={selectedMedia} onClose={() => setSelectedMedia(null)} className='z-20' />
                            )}
                        </AnimatePresence>
                    </>
                ) : (
                    <Player />
                )}
            </div>
        </div>
    );
}

export default DesktopApp;