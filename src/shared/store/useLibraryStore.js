import { create } from 'zustand';
import { exists, readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';
import { CACHE_FILE, rescanLibrary } from '../services/LibraryScanner';
import { fetchDetailedMetadata } from '../services/TMDBMetadata';
import { useTMDB } from '../hooks/useTMDB';
import { useSettingsStore } from './useSettingsStore';

export const useLibraryStore = create((set, get) => ({
    library: {},
    scanQueue: [],
    isScanning: false,
    isLoaded: false,

    loadCacheOnBoot: async () => {
        try {
            const cacheExists = await exists(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            if (!cacheExists) {
                set({ isLoaded: true });
                return;
            }

            const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            const parsedCache = JSON.parse(cacheData);
            set({ library: parsedCache.mediaItems || {}, isLoaded: true });
        } catch (error) {
            console.error("Failed to load library cache:", error);
            set({ isLoaded: true });
        }
    },

    rescan: async () => {
        const { isScanning } = get();
        
        const tmdb = useTMDB();
        const folders = useSettingsStore.getState().settings.videoLibraryFolders || [];
        
        if (!tmdb || isScanning) return;
        
        set({ isScanning: true, scanQueue: [] });
        try {
            const finalCache = await rescanLibrary(tmdb, folders, (event) => {
                const state = get();
                if (event.type === 'init') {
                    set({ scanQueue: event.queue });
                } else if (event.type === 'completed') {
                    const newQueue = state.scanQueue.filter(v => v.filePath !== event.file.filePath);
                    const newLibrary = { ...state.library };
                    if (event.mediaItem) {
                        newLibrary[event.mediaItem.compId] = event.mediaItem;
                    }
                    set({ scanQueue: newQueue, library: newLibrary });
                }
            });
            set({ library: finalCache.mediaItems, scanQueue: [] });
        } catch (error) {
            console.error("Rescan failed:", error);
            set({ scanQueue: [] });
        } finally {
            set({ isScanning: false });
        }
    },

    clearCacheAndRescan: async () => {
        try {
            const cacheExists = await exists(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            if (cacheExists) {
                await remove(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            }
        } catch (error) {
            console.error("Failed to clear cache file:", error);
        }
            
        try {
            const imagesExist = await exists('images', { baseDir: BaseDirectory.AppData });
            if (imagesExist) {
                await remove('images', { baseDir: BaseDirectory.AppData, recursive: true });
            }
        } catch (imgError) {
            console.error("Failed to delete images directory:", imgError);
        }
            
        set({ library: {} });
        await get().rescan();
    },
    
    removeMedia: async (compId, deleteFromDisk = false) => {
        try {
            const { removeMedia: rmScanner } = await import('../services/LibraryScanner');
            await rmScanner(compId, deleteFromDisk);
            set(state => {
                const newLib = { ...state.library };
                delete newLib[compId];
                return { library: newLib };
            });
        } catch (error) {
            console.error("Failed to remove media", error);
        }
    },

    updateMediaMatch: async (tmdb, oldCompId, match) => {
        try {
            const { updateMediaMatch: ummScanner } = await import('../services/LibraryScanner');
            const newEntry = await ummScanner(tmdb, oldCompId, match);
            const rawTmdbId = match.id.toString();
            const isShow = match.media_type === "tv";
            const compId = (isShow ? 'show_' : 'movie_') + rawTmdbId;
            
            set(state => {
                const newLib = { ...state.library };
                delete newLib[oldCompId];
                newLib[compId] = newEntry;
                return { library: newLib };
            });
            return compId;
        } catch (error) {
            console.error("Failed to update media match", error);
            throw error;
        }
    },

    applyBulkRematch: async (tmdb, stagedChanges) => {
        try {
            const { applyBulkRematch: abrScanner } = await import('../services/LibraryScanner');
            const newLibItems = await abrScanner(tmdb, stagedChanges);
            set({ library: newLibItems });
        } catch (error) {
            console.error("Failed to apply bulk rematch", error);
            throw error;
        }
    },

    updateEpisodeFile: async (compId, seasonNum, episodeNum, newFilePath) => {
        try {
            const { updateEpisodeFile: uefScanner } = await import('../services/LibraryScanner');
            const newLibItems = await uefScanner(compId, seasonNum, episodeNum, newFilePath);
            set({ library: newLibItems });
        } catch (error) {
            console.error("Failed to update episode file", error);
            throw error;
        }
    },

    removeEpisodeFile: async (compId, seasonNum, episodeNum, deleteFromDisk = false) => {
        try {
            const { removeEpisodeFile: refScanner } = await import('../services/LibraryScanner');
            const newLibItems = await refScanner(compId, seasonNum, episodeNum, deleteFromDisk);
            set({ library: newLibItems });
        } catch (error) {
            console.error("Failed to remove episode file", error);
            throw error;
        }
    },

    updateMediaPosters: async (compId, newPosterUrls) => {
        try {
            const { updateMediaPosters: umpScanner } = await import('../services/LibraryScanner');
            const newLibItems = await umpScanner(compId, newPosterUrls);
            set({ library: newLibItems });
        } catch (error) {
            console.error("Failed to update media posters", error);
            throw error;
        }
    }
}));
