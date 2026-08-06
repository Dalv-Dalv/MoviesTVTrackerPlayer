import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { VideoPlayer } from '../shared/VideoEngine';
import { Player } from './Player';
import { handleScanLibrary } from './hooks/useFolderScanner';
import { useVideoLibrary } from '../shared/VideoLibraryContext';

function DesktopApp() {
    const { movies, isScanning, rescanLibrary, addFolderAndScan } = useVideoLibrary();

    const [hasVideo, setHasVideo] = useState(false);

    return (
        <div className={`h-screen w-screen flex flex-col items-center justify-center transition-colors duration-500 ${hasVideo ? 'bg-transparent' : 'bg-neutral-900'} overflow-hidden`}>
            {!hasVideo ? (
                <div className="flex-1 flex items-center justify-center gap-4">
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
            ) : (
                <Player />
            )}
        </div>
    );
}

export default DesktopApp;