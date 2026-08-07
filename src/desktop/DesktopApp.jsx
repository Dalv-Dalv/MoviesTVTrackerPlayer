import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { VideoPlayer } from '../shared/VideoEngine';
import { Player } from './Player';
import { handleScanLibrary } from './hooks/useFolderScanner';
import { useVideoLibrary } from '../shared/VideoLibraryContext';
import { Poster } from '../shared/Poster';

function DesktopApp() {
    const { mediaItems, isScanning, rescanLibrary, addFolderAndScan } = useVideoLibrary();

    const [hasVideo, setHasVideo] = useState(false);

    console.log(mediaItems);

    return (
        <div className={`h-screen w-screen flex flex-col items-center justify-center transition-colors duration-500 ${hasVideo ? 'bg-transparent' : 'bg-background'} overflow-hidden`}>
            {!hasVideo ? (
                <>
                    <div className="flex items-center justify-center gap-4">
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
                    </div>

                    <div className='w-full overflow-x-auto'>
                        <div className='flex flex-row gap-4 px-4 py-10 w-max'>
                            {mediaItems.map((elem) => (
                                <div 
                                    className='group cursor-pointer relative w-[25vw] max-w-70 shrink-0 transition-transform duration-200 hover:scale-[1.02] transform-gpu will-change-transform' 
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <Player />
            )}
        </div>
    );
}

export default DesktopApp;