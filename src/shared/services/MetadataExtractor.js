import mediainfoFactory from 'mediainfo.js';
import { invoke } from '@tauri-apps/api/core';

export async function extractVideoMetadata(filePath) {
    const mediainfo = await mediainfoFactory({ 
        format: 'object',
        full: false,
        coverData: false,
        chunkSize: 256 * 1024,
        locateFile: () => '/MediaInfoModule.wasm'
    });
    
    const fileSize = await invoke('get_file_size', { path: filePath });

    let readCount = 0;
    let lastOffset = 0;

    const readChunk = async (chunkSize, offset) => {
        readCount++;
        
        if (readCount > 5) {
            return new Uint8Array(0);
        }

        lastOffset = offset + chunkSize;

        const bytes = await invoke('read_file_chunk', { 
            path: filePath, 
            offset: offset, 
            size: chunkSize 
        });
        return new Uint8Array(bytes);
    };

    try {
        const result = await mediainfo.analyzeData(
            fileSize,
            readChunk
        );
        return result;
    } catch (e) {
        console.error("[MetadataExtractor] Error:", e);
        throw e;
    } finally {
        mediainfo.close(); 
    }
}