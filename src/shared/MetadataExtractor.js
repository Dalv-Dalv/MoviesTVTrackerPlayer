import mediainfoFactory from 'mediainfo.js';
import { invoke } from '@tauri-apps/api/core';

export async function extractVideoMetadata(filePath) {
    const mediainfo = await mediainfoFactory({ 
        format: 'object',
        locateFile: () => '/MediaInfoModule.wasm'
    });
    
    const fileSize = await invoke('get_file_size', { path: filePath });

    const readChunk = async (chunkSize, offset) => {
        const bytes = await invoke('read_file_chunk', { 
            path: filePath, 
            offset: offset, 
            size: chunkSize 
        });
        return new Uint8Array(bytes);
    };

    try {
        const result = await mediainfo.analyzeData(
            () => fileSize,
            readChunk
        );
        return result;
    } finally {
        mediainfo.close(); 
    }
}