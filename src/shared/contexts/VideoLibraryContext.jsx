import parseVideo from 'video-name-parser';
import { open } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, readDir, readTextFile, remove, writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory, basename, join } from '@tauri-apps/api/path';
import { useTMDB } from '../hooks/useTMDB';
import { getFullImagePath, ImageSizes, TMDB_IMAGE_BASE_URL } from '@api-wrappers/tmdb-wrapper';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useGenres } from './GenresContext';
import { deduplicateFolders } from '../utils/PathUtils';
import { sleep, withRetry } from '../utils/GeneralUtils';
import { isMobile } from '../utils/PlatformUtils';
import { MobileFolderPicker } from '../../mobile/components/MobileFolderPicker';
import { AnimatePresence } from 'framer-motion';

const VIDEO_EXTENSIONS = ['.mkv', '.mp4', '.avi', '.webm', '.mov'];
const CACHE_FILE = 'library_cache.json';

const VideoLibraryContext = createContext();

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

const downloadImage = async (url, localFileName) => {
    try {
        if (!(await exists('images', { baseDir: BaseDirectory.AppData }))) {
            await mkdir('images', { baseDir: BaseDirectory.AppData });
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        const localPath = await join('images', localFileName);
        await writeFile(localPath, buffer, { baseDir: BaseDirectory.AppData });

        return localPath;

    } catch (error) {
        console.error("Failed to download image:", error);
        return null;
    }
};

const getPosterUrl = (posterPath) => {
    if (!posterPath) return null;
    return getFullImagePath(TMDB_IMAGE_BASE_URL, ImageSizes.ORIGINAL, posterPath);
};

const downloadLogo = async (tmdb, tmdbId, isShow) => {
    try {
        const tmdbApi = isShow ? tmdb.tvShows : tmdb.movies;

        const imagesData = await withRetry(() => tmdbApi.images(tmdbId, {
            include_image_language: ["en", "null"]
        }));

        if (!imagesData || !imagesData.logos || imagesData.logos.length <= 0) return null;

        const logoPath = imagesData.logos[0].file_path;
        const fullLogoUrl = getPosterUrl(logoPath);
        return await downloadImage(fullLogoUrl, `Logo_${tmdbId}.png`);
    } catch (imageError) {
        console.error(`Failed to fetch extra images for ${tmdbId}:`, imageError);
    }

    return null;
}

const downloadMediaImages = async (tmdb, tmdbId, match, isShow) => {
    let localPosterPath = null;
    if (match.poster_path) {
        const fullUrl = getPosterUrl(match.poster_path);
        localPosterPath = await downloadImage(fullUrl, `Poster_${tmdbId}.jpg`);
    }

    let localBackdropPath = null;
    if (match.backdrop_path) {
        const fullUrl = getPosterUrl(match.backdrop_path);
        localBackdropPath = await downloadImage(fullUrl, `Backdrop_${tmdbId}.jpg`);
    }

    let localLogoPath = await downloadLogo(tmdb, tmdbId, isShow);

    return { localPosterPath, localBackdropPath, localLogoPath };
};

export function VideoLibraryProvider({ children }) {
    const [library, setLibrary] = useState({});
    const [isScanning, setIsScanning] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showMobilePicker, setShowMobilePicker] = useState(false);

    const settings = useSettingsStore(state => state.settings);
    const addVideosFolder = useSettingsStore(state => state.addVideosFolder);
    const tmdb = useTMDB();
    const { movieGenres, tvGenres, isGenresLoaded } = useGenres();

    useEffect(() => {
        async function loadCacheOnBoot() {
            try {
                const cacheExists = await exists(CACHE_FILE, { baseDir: BaseDirectory.AppData });
                if (!cacheExists) return;

                const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
                const parsedCache = JSON.parse(cacheData);
                setLibrary(parsedCache.mediaItems || {});
            } catch (error) {
                console.error("Failed to load library cache:", error);
            } finally {
                setIsLoaded(true);
            }
        }

        loadCacheOnBoot();
    }, []);

    const rescanLibrary = async () => {
        const rawFolders = settings.videoLibraryFolders || [];
        if (rawFolders.length === 0) return;

        setIsScanning(true);

        try {
            const cleanFolders = deduplicateFolders(rawFolders);

            const allVideoPathsNested = await Promise.all(cleanFolders.map(folder => scanDirectory(folder)));
            const allVideos = allVideoPathsNested.flat();

            const parsedVideos = allVideos.map((video) => {
                const parsed = parseVideo(video.filename);
                return { ...parsed, filePath: video.filePath };
            });

            let libraryCache = { mediaItems: {}, fileMap: {}, blacklist: [] };
            const cacheExists = await exists(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            if (cacheExists) {
                const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
                libraryCache = { blacklist: [], ...JSON.parse(cacheData) };
            }

            // Prune blacklist: only keep paths that are still in allVideos
            const allVideoPaths = new Set(allVideos.map(v => v.filePath));
            libraryCache.blacklist = libraryCache.blacklist.filter(p => allVideoPaths.has(p));

            // Filter out blacklisted videos
            const blacklistedPaths = new Set(libraryCache.blacklist);
            const validParsedVideos = parsedVideos.filter(v => !blacklistedPaths.has(v.filePath));

            const newMediaItems = {};
            const newFileMap = {};

            for (const video of validParsedVideos) {
                const knownTmdbId = libraryCache.fileMap[video.filePath];

                if (knownTmdbId && libraryCache.mediaItems[knownTmdbId]) {
                    if (!newMediaItems[knownTmdbId]) {
                        newMediaItems[knownTmdbId] = {
                            ...libraryCache.mediaItems[knownTmdbId],
                            filePaths: []
                        };
                    }

                    newMediaItems[knownTmdbId].filePaths.push(video.filePath);
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
                    console.log(`Search 1 for '${rawName}' ${rawYear || ''}:`, search);
                    let match = search.results[0];

                    let extractedName = null;
                    if (!match) {
                        const yearMatch = rawName.match(/(.*?)\s+(\d{4})$/);
                        if (yearMatch) {
                            extractedName = yearMatch[1].trim();
                            const extractedYear = rawYear || yearMatch[2];

                            search = await trySearch(extractedName, extractedYear);
                            console.log(`Search 2 for '${extractedName}' ${extractedYear || ''}:`, search);
                            match = search.results[0];
                        }
                    }

                    if (!match && extractedName) {
                        search = await trySearch(extractedName, null);
                        console.log(`Search 3 for '${extractedName}' without year:`, search);
                        match = search.results[0];
                    }

                    if (!match && rawYear) {
                        search = await trySearch(rawName, null);
                        console.log(`Search 4 for '${rawName}' without year:`, search);
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
                            title: displayTitle,
                            genreIds: [],
                            releaseDate: rawYear ? `${rawYear}-01-01` : '',
                            overview: "Local video file. No TMDB metadata found.",
                            posterPath: null,
                            backdropPath: null,
                            logoPath: null,
                            filePaths: [video.filePath]
                        };
                        newFileMap[video.filePath] = fallbackId;
                        continue;
                    }

                    const tmdbId = match.id.toString();
                    const isShow = match.media_type === "tv";

                    if (newMediaItems[tmdbId]) {
                        newMediaItems[tmdbId].filePaths.push(video.filePath);
                        newFileMap[video.filePath] = tmdbId;
                        continue;
                    }

                    const { localPosterPath, localBackdropPath, localLogoPath } = await downloadMediaImages(tmdb, tmdbId, match, isShow);
                    console.log("Local logo path:");
                    console.log(localLogoPath);

                    newMediaItems[tmdbId] = {
                        tmdbId: match.id.toString(),
                        type: isShow ? 'show' : 'movie',
                        title: match.title || match.name,
                        genreIds: match.genre_ids,
                        releaseDate: match.release_date || match.first_air_date,
                        overview: match.overview,
                        posterPath: localPosterPath,
                        backdropPath: localBackdropPath,
                        logoPath: localLogoPath,
                        filePaths: [video.filePath]
                    };

                    newFileMap[video.filePath] = tmdbId;

                    await sleep(50);
                } catch (error) {
                    console.error(`TMDB search failed for ${video.name}:`, error);
                }
            }

            for (const oldTmdbId of Object.keys(libraryCache.mediaItems)) {
                if (newMediaItems[oldTmdbId]) continue;
                const oldData = libraryCache.mediaItems[oldTmdbId];

                if (oldData?.posterPath) try { await remove(oldData.posterPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
                if (oldData?.backdropPath) try { await remove(oldData.backdropPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
                if (oldData?.logoPath) try { await remove(oldData.logoPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
            }

            const finalCache = { mediaItems: newMediaItems, fileMap: newFileMap, blacklist: libraryCache.blacklist };
            await writeTextFile(CACHE_FILE, JSON.stringify(finalCache, null, 2), { baseDir: BaseDirectory.AppData });

            console.log(finalCache);

            setLibrary(newMediaItems);

        } catch (error) {
            console.error("Rescan failed:", error);
        } finally {
            setIsScanning(false);
        }
    };

    const addFolderAndScan = async () => {
        if (isMobile) {
            setShowMobilePicker(true);
            return;
        }

        const selectedFolder = await open({ directory: true, multiple: false });

        if (!selectedFolder) return

        await addVideosFolder(selectedFolder);
    };

    const clearCacheAndRescan = async () => {
        try {
            const cacheExists = await exists(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            if (cacheExists) {
                await remove(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            }
            setLibrary({});
            await rescanLibrary();
        } catch (error) {
            console.error("Failed to clear cache:", error);
        }
    };

    const updateMediaMatch = async (oldTmdbId, match) => {
        try {
            const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            const libraryCache = JSON.parse(cacheData);

            const oldData = libraryCache.mediaItems[oldTmdbId];
            if (!oldData) throw new Error("Old media item not found in cache");

            const filePaths = oldData.filePaths;
            const tmdbId = match.id.toString();
            const isShow = match.media_type === "tv";
            const { localPosterPath, localBackdropPath, localLogoPath } = await downloadMediaImages(tmdb, tmdbId, match, isShow);

            const newEntry = {
                tmdbId: tmdbId,
                type: isShow ? 'show' : 'movie',
                title: match.title || match.name,
                genreIds: match.genre_ids,
                releaseDate: match.release_date || match.first_air_date,
                overview: match.overview,
                posterPath: localPosterPath,
                backdropPath: localBackdropPath,
                logoPath: localLogoPath,
                filePaths: filePaths
            };

            if (oldData.posterPath) try { await remove(oldData.posterPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
            if (oldData.backdropPath) try { await remove(oldData.backdropPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
            if (oldData.logoPath) try { await remove(oldData.logoPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }

            delete libraryCache.mediaItems[oldTmdbId];
            libraryCache.mediaItems[tmdbId] = newEntry;

            for (const p of filePaths) {
                libraryCache.fileMap[p] = tmdbId;
            }

            await writeTextFile(CACHE_FILE, JSON.stringify(libraryCache, null, 2), { baseDir: BaseDirectory.AppData });

            setLibrary(prev => {
                const newLib = { ...prev };
                delete newLib[oldTmdbId];
                newLib[tmdbId] = newEntry;
                return newLib;
            });

            return tmdbId;
        } catch (e) {
            console.error("Failed to update media match", e);
            throw e;
        }
    };

    const removeMedia = async (tmdbId, deleteFromDisk = false) => {
        try {
            const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            const libraryCache = { blacklist: [], ...JSON.parse(cacheData) };

            const oldData = libraryCache.mediaItems[tmdbId];
            if (!oldData) return;

            const filePaths = oldData.filePaths || [];

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

            setLibrary(prev => {
                const newLib = { ...prev };
                delete newLib[tmdbId];
                return newLib;
            });
        } catch (e) {
            console.error("Failed to remove media", e);
            throw e;
        }
    };

    const applyBulkRematch = async (stagedChanges) => {
        try {
            const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            const libraryCache = { blacklist: [], ...JSON.parse(cacheData) };

            for (const change of stagedChanges) {
                const { match, filePaths } = change;
                const tmdbId = match.id.toString();
                const isShow = match.media_type === "tv";

                for (const path of filePaths) {
                    const oldTmdbId = libraryCache.fileMap[path];
                    if (oldTmdbId && libraryCache.mediaItems[oldTmdbId]) {
                        libraryCache.mediaItems[oldTmdbId].filePaths = libraryCache.mediaItems[oldTmdbId].filePaths.filter(p => p !== path);

                        if (libraryCache.mediaItems[oldTmdbId].filePaths.length === 0) {
                            const oldData = libraryCache.mediaItems[oldTmdbId];
                            if (oldData.posterPath) try { await remove(oldData.posterPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
                            if (oldData.backdropPath) try { await remove(oldData.backdropPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
                            if (oldData.logoPath) try { await remove(oldData.logoPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
                            delete libraryCache.mediaItems[oldTmdbId];
                        }
                    }
                    libraryCache.fileMap[path] = tmdbId;
                }

                if (libraryCache.mediaItems[tmdbId]) {
                    libraryCache.mediaItems[tmdbId].filePaths.push(...filePaths);
                    libraryCache.mediaItems[tmdbId].filePaths = [...new Set(libraryCache.mediaItems[tmdbId].filePaths)];
                } else {
                    const { localPosterPath, localBackdropPath, localLogoPath } = await downloadMediaImages(tmdb, tmdbId, match, isShow);
                    libraryCache.mediaItems[tmdbId] = {
                        tmdbId: tmdbId,
                        type: isShow ? 'show' : 'movie',
                        title: match.title || match.name,
                        genreIds: match.genre_ids,
                        releaseDate: match.release_date || match.first_air_date,
                        overview: match.overview,
                        posterPath: localPosterPath,
                        backdropPath: localBackdropPath,
                        logoPath: localLogoPath,
                        filePaths: [...filePaths]
                    };
                }
            }

            await writeTextFile(CACHE_FILE, JSON.stringify(libraryCache, null, 2), { baseDir: BaseDirectory.AppData });
            setLibrary(libraryCache.mediaItems);
        } catch (e) {
            console.error("Failed to apply bulk rematch", e);
            throw e;
        }
    };

    useEffect(() => {
        if (!isLoaded) return;
        rescanLibrary();
    }, [settings.videoLibraryFolders, isLoaded]);

    const mappedLibrary = useMemo(() => {
        if (!isGenresLoaded) return library;

        const mapped = {};
        for (const [id, item] of Object.entries(library)) {
            mapped[id] = {
                ...item,
                genres: (item.genreIds || []).map(gId => {
                    const dict = item.mediaType === 'show' ? tvGenres : movieGenres;
                    return dict[gId] || null;
                }).filter(Boolean)
            };
        }
        return mapped;
    }, [library, movieGenres, tvGenres, isGenresLoaded]);

    return (
        <VideoLibraryContext.Provider value={{
            library: mappedLibrary,
            isScanning,
            isLoaded,
            rescanLibrary,
            addFolderAndScan,
            clearCacheAndRescan,
            updateMediaMatch,
            applyBulkRematch,
            removeMedia
        }}>
            {children}

            {isMobile && (
                <AnimatePresence>
                    {showMobilePicker && (
                        <MobileFolderPicker
                            onClose={() => setShowMobilePicker(false)}
                            onSaveComplete={() => rescanLibrary()}
                        />
                    )}
                </AnimatePresence>
            )}
        </VideoLibraryContext.Provider>
    );
}

export const useVideoLibrary = () => useContext(VideoLibraryContext);
