import parseVideo from 'video-name-parser';
import { exists, readDir, readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';
import { deduplicateFolders } from '../utils/PathUtils';
import { sleep, withRetry } from '../utils/GeneralUtils';
import { fetchDetailedMetadata } from './TMDBMetadata';
import { useLibraryStore } from '../store/useLibraryStore';

const VIDEO_EXTENSIONS = ['.mkv', '.mp4', '.avi', '.webm', '.mov'];
export const CACHE_FILE = 'library_cache.json';

const scanDirectory = async (dirPath) => {
    let foundVideos = [];
    try {
        const entries = await readDir(dirPath);
        const separator = dirPath.includes('\\') ? '\\' : '/';

        for (const entry of entries) {
            const fullPath = dirPath.endsWith(separator) ? dirPath + entry.name : dirPath + separator + entry.name;
            if (entry.isDirectory) {
                const subFolderVideos = await scanDirectory(fullPath);
                foundVideos.push(...subFolderVideos);
            } else if (entry.isFile) {
                const isVideo = VIDEO_EXTENSIONS.some(ext => entry.name.toLowerCase().endsWith(ext));
                if (isVideo) foundVideos.push({ filePath: fullPath, filename: entry.name });
            }
        }
    } catch (error) {
        console.error(`Failed to read directory ${dirPath}:`, error);
    }
    return foundVideos;
};

export const rescanLibrary = async (tmdb, rawFolders) => {
    if (!rawFolders || rawFolders.length === 0) return { mediaItems: {}, fileMap: {}, blacklist: [] };

    const cleanFolders = deduplicateFolders(rawFolders);
    const allVideoPathsNested = await Promise.all(cleanFolders.map(folder => scanDirectory(folder)));
    const allVideos = allVideoPathsNested.flat();

    const parsedVideos = allVideos.map((video) => {
        const parsed = parseVideo(video.filename);
        return { ...parsed, filePath: video.filePath, filename: video.filename };
    });

    let libraryCache = { mediaItems: {}, fileMap: {}, blacklist: [] };
    const cacheExists = await exists(CACHE_FILE, { baseDir: BaseDirectory.AppData });
    if (cacheExists) {
        try {
            const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            libraryCache = { blacklist: [], ...JSON.parse(cacheData) };
        } catch (e) {
            console.warn("Cache file exists but could not be read (likely just deleted). Treating as empty.", e);
        }
    }

    const allVideoPaths = new Set(allVideos.map(v => v.filePath));
    libraryCache.blacklist = libraryCache.blacklist.filter(p => allVideoPaths.has(p));
    
    const blacklistedPaths = new Set(libraryCache.blacklist);
    const validParsedVideos = parsedVideos.filter(v => !blacklistedPaths.has(v.filePath));

    const newMediaItems = {};
    const newFileMap = {};

    for (const video of validParsedVideos) {
        const knownTmdbId = libraryCache.fileMap[video.filePath];

        if (knownTmdbId && libraryCache.mediaItems[knownTmdbId]) {
            if (!newMediaItems[knownTmdbId]) {
                newMediaItems[knownTmdbId] = JSON.parse(JSON.stringify(libraryCache.mediaItems[knownTmdbId]));
                
                if (newMediaItems[knownTmdbId].type === 'movie') {
                    newMediaItems[knownTmdbId].filePaths = [];
                } else if (newMediaItems[knownTmdbId].type === 'show') {
                    if (newMediaItems[knownTmdbId].seasons) {
                        for (const s of (newMediaItems[knownTmdbId].seasons || []).filter(Boolean)) {
                            if (s.episodes) {
                                for (const e of (s.episodes || []).filter(Boolean)) {
                                    e.filePaths = [];
                                    e.isDownloaded = false;
                                }
                            }
                        }
                    }
                    if (newMediaItems[knownTmdbId].specials && newMediaItems[knownTmdbId].specials.episodes) {
                        for (const e of (newMediaItems[knownTmdbId].specials.episodes || []).filter(Boolean)) {
                            e.filePaths = [];
                            e.isDownloaded = false;
                        }
                    }
                }
            }

            const media = newMediaItems[knownTmdbId];
            if (media.type === 'movie') {
                if (!media.filePaths.includes(video.filePath)) {
                    media.filePaths.push(video.filePath);
                }
            } else if (media.type === 'show') {
                const s = video.season || 1;
                const e = (video.episode && video.episode.length > 0) ? video.episode[0] : 1;
                let targetSeason;
                if (s === 0) {
                    targetSeason = media.specials;
                } else if (media.seasons) {
                    targetSeason = media.seasons[s - 1];
                }
                if (targetSeason && targetSeason.episodes && targetSeason.episodes[e - 1]) {
                    const ep = targetSeason.episodes[e - 1];
                    if (!ep.filePaths.includes(video.filePath)) {
                        ep.filePaths.push(video.filePath);
                        ep.isDownloaded = true;
                    }
                }
            }
            newFileMap[video.filePath] = knownTmdbId;
            continue;
        }

        try {
            const rawName = video.name.trim();
            const rawYear = video.year;

            const trySearch = async (queryName, queryYear) => {
                if (!queryName) return { results: [] };
                return await withRetry(() => tmdb.search.multi({
                    query: queryName,
                    ...(queryYear ? { primary_release_year: queryYear } : {}),
                    language: "en-US",
                    page: 1
                }));
            };

            let search = await trySearch(rawName, rawYear);
            let match = search.results[0];

            let extractedName = null;
            if (!match) {
                const yearMatch = rawName.match(/(.*?)\s+(\d{4})$/);
                if (yearMatch) {
                    extractedName = yearMatch[1].trim();
                    const extractedYear = rawYear || yearMatch[2];
                    search = await trySearch(extractedName, extractedYear);
                    match = search.results[0];
                }
            }

            if (!match && extractedName) {
                search = await trySearch(extractedName, null);
                match = search.results[0];
            }

            if (!match && rawYear) {
                search = await trySearch(rawName, null);
                match = search.results[0];
            }

            if (!match) {
                console.warn(`No TMDB match found for ${video.name} (${video.filename}). Adding as local file.`);
                const fallbackId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                let displayTitle = extractedName || rawName || video.filename.replace(/\.[^/.]+$/, "");
                displayTitle = displayTitle.replace(/\b\w/g, c => c.toUpperCase());

                newMediaItems[fallbackId] = {
                    tmdbId: fallbackId,
                    type: video.type === 'series' ? 'show' : 'movie',
                    isDownloaded: true,
                    isFullyLoaded: false,
                    title: displayTitle,
                    genreIds: [],
                    releaseDate: rawYear ? `${rawYear}-01-01` : '',
                    overview: "Local video file. No TMDB metadata found.",
                    posterPath: null, backdropPath: null, logoPath: null,
                };

                if (newMediaItems[fallbackId].type === 'movie') {
                    newMediaItems[fallbackId].filePaths = [video.filePath];
                } else {
                    const sNum = video.season || 1;
                    const eNum = (video.episode && video.episode.length > 0) ? video.episode[0] : 1;
                    newMediaItems[fallbackId].seasons = [];
                    newMediaItems[fallbackId].specials = null;
                    const seasonObj = {
                        number: sNum,
                        name: `Season ${sNum}`,
                        episodes: []
                    };
                    seasonObj.episodes[eNum - 1] = {
                        number: eNum,
                        name: `Episode ${eNum}`,
                        isDownloaded: true,
                        filePaths: [video.filePath]
                    };
                    
                    if (sNum === 0) {
                        seasonObj.name = 'Specials';
                        newMediaItems[fallbackId].specials = seasonObj;
                    } else {
                        newMediaItems[fallbackId].seasons[sNum - 1] = seasonObj;
                    }
                }

                newFileMap[video.filePath] = fallbackId;
                continue;
            }

            const tmdbId = match.id.toString();
            const isShow = match.media_type === "tv";

            if (!newMediaItems[tmdbId]) {
                newMediaItems[tmdbId] = await fetchDetailedMetadata(tmdb, tmdbId, isShow ? 'show' : 'movie', true);
            }

            const media = newMediaItems[tmdbId];
            if (media.type === 'movie') {
                if (!media.filePaths.includes(video.filePath)) media.filePaths.push(video.filePath);
            } else if (media.type === 'show') {
                const s = video.season || 1;
                const e = (video.episode && video.episode.length > 0) ? video.episode[0] : 1;
                
                let targetSeason;
                if (s === 0) {
                    if (!media.specials) media.specials = { number: 0, name: 'Specials', episodes: [] };
                    targetSeason = media.specials;
                } else {
                    if (!media.seasons) media.seasons = [];
                    if (!media.seasons[s - 1]) {
                        media.seasons[s - 1] = { number: s, name: `Season ${s}`, episodes: [] };
                    }
                    targetSeason = media.seasons[s - 1];
                }
                
                if (!targetSeason.episodes) targetSeason.episodes = [];
                
                if (!targetSeason.episodes[e - 1]) {
                    targetSeason.episodes[e - 1] = {
                        number: e,
                        name: `Episode ${e}`,
                        filePaths: [],
                        isDownloaded: false
                    };
                }
                
                if (!targetSeason.episodes[e - 1].filePaths.includes(video.filePath)) {
                    targetSeason.episodes[e - 1].filePaths.push(video.filePath);
                    targetSeason.episodes[e - 1].isDownloaded = true;
                }
            }
            newFileMap[video.filePath] = tmdbId;

        } catch (error) {
            console.error(`TMDB search/fetch failed for ${video.name}:`, error);
        }
    }

    // Cleanup old images for removed media
    for (const oldTmdbId of Object.keys(libraryCache.mediaItems)) {
        if (newMediaItems[oldTmdbId]) continue; // Kept
        const oldData = libraryCache.mediaItems[oldTmdbId];

        if (oldData?.posterPath) try { await remove(oldData.posterPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
        if (oldData?.backdropPath) try { await remove(oldData.backdropPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
        if (oldData?.logoPath) try { await remove(oldData.logoPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
    }

    const finalCache = { mediaItems: newMediaItems, fileMap: newFileMap, blacklist: libraryCache.blacklist };
    await writeTextFile(CACHE_FILE, JSON.stringify(finalCache, null, 2), { baseDir: BaseDirectory.AppData });

    return finalCache;
};

export const updateMediaMatch = async (tmdb, oldTmdbId, match) => {
    try {
        const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
        const libraryCache = JSON.parse(cacheData);
        
        const oldData = libraryCache.mediaItems[oldTmdbId];
        if (!oldData) throw new Error("Old media item not found in cache");
        
        const filePaths = [];
        if (oldData.type === 'movie') {
            filePaths.push(...(oldData.filePaths || []));
        } else if (oldData.type === 'show') {
            if (oldData.seasons) {
                for (const s of (oldData.seasons || []).filter(Boolean)) {
                    if (s.episodes) {
                        for (const e of (s.episodes || []).filter(Boolean)) {
                            filePaths.push(...(e.filePaths || []));
                        }
                    }
                }
            }
            if (oldData.specials && oldData.specials.episodes) {
                for (const e of (oldData.specials.episodes || []).filter(Boolean)) {
                    filePaths.push(...(e.filePaths || []));
                }
            }
        }

        const tmdbId = match.id.toString();
        const isShow = match.media_type === "tv";
        const { downloadMediaImages } = await import('./TMDBMetadata');
        const { localPosterPath, localBackdropPath, localLogoPath } = await downloadMediaImages(tmdb, tmdbId, match, isShow);

        const newEntry = {
            tmdbId: tmdbId,
            type: isShow ? 'show' : 'movie',
            isDownloaded: true,
            isFullyLoaded: false,
            title: match.title || match.name,
            genreIds: match.genre_ids || [],
            releaseDate: match.release_date || match.first_air_date,
            overview: match.overview,
            posterPath: localPosterPath,
            backdropPath: localBackdropPath,
            logoPath: localLogoPath,
            filePaths: isShow ? undefined : filePaths,
            seasons: [],
            specials: null
        };

        if (isShow) {
            for (const path of filePaths) {
                const filename = path.split(/[\\/]/).pop();
                const video = parseVideo(filename);
                const s = video.season || 1;
                const e = (video.episode && video.episode.length > 0) ? video.episode[0] : 1;
                
                let targetSeason;
                if (s === 0) {
                    if (!newEntry.specials) newEntry.specials = { number: 0, name: 'Specials', episodes: [] };
                    targetSeason = newEntry.specials;
                } else {
                    if (!newEntry.seasons) newEntry.seasons = [];
                    if (!newEntry.seasons[s - 1]) newEntry.seasons[s - 1] = { number: s, name: `Season ${s}`, episodes: [] };
                    targetSeason = newEntry.seasons[s - 1];
                }

                if (!targetSeason.episodes) targetSeason.episodes = [];
                
                if (!targetSeason.episodes[e - 1]) {
                    targetSeason.episodes[e - 1] = {
                        number: e,
                        name: `Episode ${e}`,
                        filePaths: [],
                        isDownloaded: false
                    };
                }
                
                if (!targetSeason.episodes[e - 1].filePaths.includes(path)) {
                    targetSeason.episodes[e - 1].filePaths.push(path);
                    targetSeason.episodes[e - 1].isDownloaded = true;
                }
            }
        }
        
        if (oldData.posterPath) try { await remove(oldData.posterPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
        if (oldData.backdropPath) try { await remove(oldData.backdropPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
        if (oldData.logoPath) try { await remove(oldData.logoPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
        
        delete libraryCache.mediaItems[oldTmdbId];
        libraryCache.mediaItems[tmdbId] = newEntry;
        
        for (const p of filePaths) {
            libraryCache.fileMap[p] = tmdbId;
        }
        
        await writeTextFile(CACHE_FILE, JSON.stringify(libraryCache, null, 2), { baseDir: BaseDirectory.AppData });
        
        return newEntry;
    } catch (e) {
        console.error("Failed to update media match", e);
        throw e;
    }
};

export const removeMedia = async (tmdbId, deleteFromDisk = false) => {
    try {
        const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
        const libraryCache = { blacklist: [], ...JSON.parse(cacheData) };
        
        const oldData = libraryCache.mediaItems[tmdbId];
        if (!oldData) return;
        
        let filePaths = [];
        if (oldData.type === 'movie') {
            filePaths = oldData.filePaths || [];
        } else if (oldData.type === 'show') {
            if (oldData.seasons) {
                for (const s of (oldData.seasons || []).filter(Boolean)) {
                    if (s.episodes) {
                        for (const e of (s.episodes || []).filter(Boolean)) {
                            filePaths.push(...(e.filePaths || []));
                        }
                    }
                }
            }
            if (oldData.specials && oldData.specials.episodes) {
                for (const e of (oldData.specials.episodes || []).filter(Boolean)) {
                    filePaths.push(...(e.filePaths || []));
                }
            }
        }
        
        if (deleteFromDisk) {
            for (const path of filePaths) {
                try { await remove(path); } catch (e) { console.error("Failed to delete file from disk:", path, e); }
            }
        } else {
            libraryCache.blacklist.push(...filePaths);
            libraryCache.blacklist = [...new Set(libraryCache.blacklist)];
        }
        
        if (oldData.posterPath) try { await remove(oldData.posterPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
        if (oldData.backdropPath) try { await remove(oldData.backdropPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
        if (oldData.logoPath) try { await remove(oldData.logoPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
        
        delete libraryCache.mediaItems[tmdbId];
        for (const p of filePaths) {
            delete libraryCache.fileMap[p];
        }
        
        await writeTextFile(CACHE_FILE, JSON.stringify(libraryCache, null, 2), { baseDir: BaseDirectory.AppData });
    } catch (e) {
        console.error("Failed to remove media", e);
        throw e;
    }
};

export const applyBulkRematch = async (tmdb, stagedChanges) => {
    try {
        const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
        const libraryCache = { blacklist: [], ...JSON.parse(cacheData) };
        const { downloadMediaImages } = await import('./TMDBMetadata');
        
        for (const change of stagedChanges) {
            const { match, filePaths } = change;
            const tmdbId = match.id.toString();
            const isShow = match.media_type === "tv";
            
            for (const path of filePaths) {
                const oldTmdbId = libraryCache.fileMap[path];
                if (oldTmdbId && libraryCache.mediaItems[oldTmdbId]) {
                    const oldItem = libraryCache.mediaItems[oldTmdbId];
                    let hasFilesLeft = false;

                    if (oldItem.type === 'movie') {
                        oldItem.filePaths = (oldItem.filePaths || []).filter(p => p !== path);
                        hasFilesLeft = oldItem.filePaths.length > 0;
                    } else if (oldItem.type === 'show') {
                        if (oldItem.seasons) {
                            for (const s of (oldItem.seasons || []).filter(Boolean)) {
                                if (s.episodes) {
                                    for (const e of (s.episodes || []).filter(Boolean)) {
                                        e.filePaths = (e.filePaths || []).filter(p => p !== path);
                                        if (e.filePaths.length > 0) hasFilesLeft = true;
                                    }
                                }
                            }
                        }
                        if (oldItem.specials && oldItem.specials.episodes) {
                            for (const e of (oldItem.specials.episodes || []).filter(Boolean)) {
                                e.filePaths = (e.filePaths || []).filter(p => p !== path);
                                if (e.filePaths.length > 0) hasFilesLeft = true;
                            }
                        }
                    }
                    
                    if (!hasFilesLeft) {
                        if (oldItem.posterPath) try { await remove(oldItem.posterPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
                        if (oldItem.backdropPath) try { await remove(oldItem.backdropPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
                        if (oldItem.logoPath) try { await remove(oldItem.logoPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
                        delete libraryCache.mediaItems[oldTmdbId];
                    }
                }
                libraryCache.fileMap[path] = tmdbId;
            }
            
            if (!libraryCache.mediaItems[tmdbId]) {
                const { localPosterPath, localBackdropPath, localLogoPath } = await downloadMediaImages(tmdb, tmdbId, match, isShow);
                libraryCache.mediaItems[tmdbId] = {
                    tmdbId: tmdbId,
                    type: isShow ? 'show' : 'movie',
                    isDownloaded: true,
                    isFullyLoaded: false,
                    title: match.title || match.name,
                    genreIds: match.genre_ids || [],
                    releaseDate: match.release_date || match.first_air_date,
                    overview: match.overview,
                    posterPath: localPosterPath,
                    backdropPath: localBackdropPath,
                    logoPath: localLogoPath,
                    filePaths: isShow ? undefined : [],
                    seasons: [],
                    specials: null
                };
            }

            const item = libraryCache.mediaItems[tmdbId];
            if (isShow) {
                for (const path of filePaths) {
                    const filename = path.split(/[\\/]/).pop();
                    const video = parseVideo(filename);
                    const s = video.season || 1;
                    const e = (video.episode && video.episode.length > 0) ? video.episode[0] : 1;
                    
                    let targetSeason;
                    if (s === 0) {
                        if (!item.specials) item.specials = { number: 0, name: 'Specials', episodes: [] };
                        targetSeason = item.specials;
                    } else {
                        if (!item.seasons) item.seasons = [];
                        if (!item.seasons[s - 1]) item.seasons[s - 1] = { number: s, name: `Season ${s}`, episodes: [] };
                        targetSeason = item.seasons[s - 1];
                    }

                    if (!targetSeason.episodes) targetSeason.episodes = [];
                    
                    if (!targetSeason.episodes[e - 1]) {
                        targetSeason.episodes[e - 1] = {
                            number: e,
                            name: `Episode ${e}`,
                            filePaths: [],
                            isDownloaded: false
                        };
                    }
                    
                    if (!targetSeason.episodes[e - 1].filePaths.includes(path)) {
                        targetSeason.episodes[e - 1].filePaths.push(path);
                        targetSeason.episodes[e - 1].isDownloaded = true;
                    }
                }
            } else {
                item.filePaths = item.filePaths || [];
                item.filePaths.push(...filePaths);
                item.filePaths = [...new Set(item.filePaths)];
            }
        }
        
        await writeTextFile(CACHE_FILE, JSON.stringify(libraryCache, null, 2), { baseDir: BaseDirectory.AppData });
        return libraryCache.mediaItems;
    } catch (e) {
        console.error("Failed to apply bulk rematch", e);
        throw e;
    }
};
