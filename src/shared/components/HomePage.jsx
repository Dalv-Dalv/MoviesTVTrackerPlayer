import { useNavigate } from "react-router-dom";
import { useLibraryStore } from "../store/useLibraryStore";
import { useEffect, useRef, useState } from "react";
import { Carousel } from "./Carousel";
import { MovieImage } from "./MovieImage";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { isMobile } from "../utils/PlatformUtils";

export default function HomePage({ className = '' }) {
    const navigate = useNavigate();
    const library = useLibraryStore(state => state.library);
    const isScanning = useLibraryStore(state => state.isScanning);
    const scanQueue = useLibraryStore(state => state.scanQueue);
    const rescanLibrary = useLibraryStore(state => state.rescan);
    const mediaItems = Object.values(library);


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

    return (
        <>
            <div className="w-full pb-24">
                {mediaItems[1] && (
                    <div className='relative w-full flex items-center justify-center px-4 d:px-6 pb-32 pt-24 m:pt-14 -mb-32 noselect'>
                        <MovieImage relativePath={mediaItems[1].backdropPath} altText={mediaItems[1].title}
                            className='w-full absolute inset-0 scale-180 d:scale-130 origin-top transform-gpu blur-lg opacity-75 mask-[linear-gradient(to_bottom,transparent,black,transparent)] d:mask-[linear-gradient(to_bottom,black,transparent)]' />
                            
                        
                        <div className='relative w-full d:w-3/4 rounded-2xl overflow-hidden aspect-video shadow-lg shadow-background/20'>
                            <MovieImage relativePath={mediaItems[1].backdropPath} altText={mediaItems[1].title}
                                className='w-full' />

                            <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/70 pointer-events-none mix-blend-soft-light" />
                            <div className="absolute rounded-2xl inset-0 ring-1 ring-inset ring-white/8 pointer-events-none" />

                            <MovieImage relativePath={mediaItems[1].logoPath} altText={mediaItems[1].title}
                                className='absolute left-[3vw] bottom-[3vw] w-100 max-w-1/2' />
                        </div>
                    </div>
                )}


                <div className='px-12 mt-10 text-body -mb-6 flex flex-row gap-4 items-center justify-between noselect relative z-10'>
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
                    <Carousel id="home-library" className="relative z-0" paddingClass="px-6 d:px-12 scroll-px-6 d:scroll-px-12">
                        {mediaItems.map((elem) => (
                            <div
                                onClick={() => navigate(`/details/${elem.tmdbId}`)}
                                className='group cursor-pointer relative w-[35vw] d:w-[25vw] max-w-70 shrink-0 aspect-2/3 snap-start transform-gpu will-change-transform transition-transform duration-300 hover:scale-[1.02]'
                                key={elem.tmdbId}
                            >
                                <div className="relative w-full h-full">
                                    {!isMobile && (
                                        <MovieImage
                                            relativePath={elem.posterPath}
                                            altText={elem.title}
                                            className='absolute inset-0 blur-md opacity-0 transition-opacity duration-200 group-hover:opacity-100'
                                        />
                                    )}

                                    <div className="relative z-10 w-full h-full rounded-lg overflow-hidden bg-background">
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

                        {scanQueue && scanQueue.map((video, idx) => (
                            <div 
                                key={`skeleton-${video.filePath}-${idx}`}
                                className='group relative w-[35vw] d:w-[25vw] max-w-70 shrink-0 aspect-2/3 snap-start'
                            >
                                <div className="relative z-10 w-full h-full rounded-lg overflow-hidden bg-surface animate-pulse flex flex-col items-center justify-center p-4">
                                    <div className="absolute rounded-lg inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                                </div>
                            </div>
                        ))}
                    </Carousel>
                </div>
            </div>
        </>
    );
}
