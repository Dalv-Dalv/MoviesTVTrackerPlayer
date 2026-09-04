import mediainfoFactory from 'mediainfo.js';
import { invoke } from '@tauri-apps/api/core';

export async function extractVideoMetadata(filePath) {
    console.log("[MetadataExtractor] Starting extraction for", filePath);
    const mediainfo = await mediainfoFactory({ 
        format: 'object',
        full: false,
        coverData: false,
        chunkSize: 256 * 1024, // 256KB chunks for instant reads
        locateFile: () => '/MediaInfoModule.wasm'
    });
    
    const fileSize = await invoke('get_file_size', { path: filePath });
    console.log("[MetadataExtractor] File size:", fileSize);

    let readCount = 0;
    let lastOffset = 0;

    const readChunk = async (chunkSize, offset) => {
        readCount++;
        
        // Force EOF if it tries to read more than 5 chunks (1.25MB total).
        // This makes extraction practically instantaneous.
        if (readCount > 5) {
            console.log(`[MetadataExtractor] Forcing EOF to prevent endless scanning.`);
            return new Uint8Array(0);
        }

        if (readCount <= 5 || Math.abs(offset - lastOffset) > 10 * 1024 * 1024) {
            console.log(`[MetadataExtractor] Read #${readCount} - Offset: ${offset} (Size: ${chunkSize})`);
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
        console.log("[MetadataExtractor] Done in", readCount, "reads");
        return result;
    } catch (e) {
        console.error("[MetadataExtractor] Error:", e);
        throw e;
    } finally {
        mediainfo.close(); 
    }
}