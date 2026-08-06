import parseVideo from 'video-name-parser';
import { open } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, readDir, readTextFile, remove, writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory, basename, join } from '@tauri-apps/api/path';
import { useTMDB } from './hooks/useTMDB';
import { getFullImagePath, ImageSizes, TMDB_IMAGE_BASE_URL } from '@api-wrappers/tmdb-wrapper';
import { createContext, useContext, useEffect, useState } from 'react';
import { useSettings } from './SettingsContext';
import { deduplicateFolders } from './PathUtils';
import { sleep, withRetry } from './GeneralUtils';

const VIDEO_EXTENSIONS = ['.mkv', '.mp4', '.avi', '.webm', '.mov'];
const CACHE_FILE = 'library_cache.json';

const VideoLibraryContext = createContext();

const scanDirectory = async (dirPath) => {
    let foundVideos = [];

    try {
        const entries = await readDir(dirPath);

        for (const entry of entries) {
            const fullPath = await join(dirPath, entry.name);

            if (entry.isDirectory) {
                const subFolderVideos = await scanDirectory(fullPath);
                foundVideos.push(...subFolderVideos);
            } else if (entry.isFile) {
                const isVideo = VIDEO_EXTENSIONS.some(ext => entry.name.toLowerCase().endsWith(ext));
                if (isVideo) foundVideos.push(fullPath);
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

export function VideoLibraryProvider({ children }) {
    const [library, setLibrary] = useState({});
    const [isScanning, setIsScanning] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const { settings, addVideosFolder } = useSettings();
    const tmdb = useTMDB();

    useEffect(() => {
        async function loadCacheOnBoot() {
            try {
                const cacheExists = await exists(CACHE_FILE, { baseDir: BaseDirectory.AppData });
                if (!cacheExists) return;

                const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
                const parsedCache = JSON.parse(cacheData);
                setLibrary(parsedCache.movies || {});
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
            const allVideoPaths = allVideoPathsNested.flat();

            const parsedVideos = await Promise.all(
                allVideoPaths.map(async (filePath) => {
                    const filename = await basename(filePath);
                    const parsed = parseVideo(filename);
                    return { ...parsed, filePath };
                })
            );

            let libraryCache = { movies: {}, fileMap: {} };
            const cacheExists = await exists(CACHE_FILE, { baseDir: BaseDirectory.AppData });
            if (cacheExists) {
                const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
                libraryCache = JSON.parse(cacheData);
            }

            const newMovies = {};
            const newFileMap = {};

            for (const video of parsedVideos) {
                if (video.type === 'series') continue; // TODO: Handle shows, also dont rely on just the parseVideo data, use tmdb to double check
                
                const knownTmdbId = libraryCache.fileMap[video.filePath];

                if (knownTmdbId && libraryCache.movies[knownTmdbId]) {
                    if (!newMovies[knownTmdbId]) {
                        newMovies[knownTmdbId] = { 
                            ...libraryCache.movies[knownTmdbId], 
                            filePaths: [] 
                        };
                    }

                    newMovies[knownTmdbId].filePaths.push(video.filePath);
                    newFileMap[video.filePath] = knownTmdbId;
                    continue;
                }

                try {
                    const search = await withRetry(() => tmdb.search.movies({
                        query: video.name,
                        primary_release_year: video.year,
                        language: "en-US",
                        page: 1
                    }));

                    const match = search.results[0];
                    if (!match) continue;

                    const tmdbId = match.id.toString();

                    if (!newMovies[tmdbId]) {
                        let localPosterPath = null;
                        if (match.poster_path) {
                            const fullUrl = getPosterUrl(match.poster_path);
                            console.log(fullUrl);
                            localPosterPath = await downloadImage(fullUrl, `Poster_${match.id}.jpg`);
                        }

                        let localBackdropPath = null;
                        if (match.backdrop_path) {
                            const fullUrl = getPosterUrl(match.backdrop_path);
                            console.log(fullUrl);
                            localBackdropPath = await downloadImage(fullUrl, `Backdrop_${match.id}.jpg`);
                        }

                        let localLogoPath = null;
                        try {
                            const imagesData = await withRetry(() => tmdb.movies.images(match.id, {
                                include_image_language: ["en", "null"]
                            }));

                            console.log("Images: ", imagesData);

                            if (imagesData && imagesData.logos && imagesData.logos.length > 0) {
                                const logoPath = imagesData.logos[0].file_path;
                                const fullLogoUrl = getPosterUrl(logoPath);
                                console.log(fullLogoUrl);
                                localLogoPath = await downloadImage(fullLogoUrl, `Logo_${match.id}.png`);
                            }
                        } catch (imageError) {
                            console.error(`Failed to fetch extra images for ${match.title}:`, imageError);
                        }   

                        newMovies[tmdbId] = {
                            tmdbId: match.id.toString(),
                            title: match.title,
                            genreIds: match.genre_ids,
                            releaseDate: match.release_date,
                            overview: match.overview,
                            posterPath: localPosterPath,
                            backdropPath: localBackdropPath,
                            logoPath: localLogoPath,
                            filePaths: []
                        };
                    }

                    newMovies[tmdbId].filePaths.push(video.filePath);
                    newFileMap[video.filePath] = tmdbId;

                    await sleep(50);
                } catch (error) {
                    console.error(`TMDB search failed for ${video.name}:`, error);
                }
            }

            for (const oldTmdbId of Object.keys(libraryCache.movies)) {
                if (newMovies[oldTmdbId]) continue;
                const oldData = libraryCache.movies[oldTmdbId];

                if (oldData?.posterPath) try { await remove(oldData.posterPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
                if (oldData?.backdropPath) try { await remove(oldData.backdropPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
                if (oldData?.logoPath) try { await remove(oldData.logoPath, { baseDir: BaseDirectory.AppData }); } catch (e) { }
            }
            
            const finalCache = { movies: newMovies, fileMap: newFileMap };
            await writeTextFile(CACHE_FILE, JSON.stringify(finalCache, null, 2), { baseDir: BaseDirectory.AppData });

            console.log(finalCache);

            setLibrary(newMovies);

        } catch (error) {
            console.error("Rescan failed:", error);
        } finally {
            setIsScanning(false);
        }
    };

    const addFolderAndScan = async () => {
        const selectedFolder = await open({ directory: true, multiple: false });

        if (!selectedFolder) return

        await addVideosFolder(selectedFolder);
    };

    useEffect(() => {
        if (!isLoaded) return;
        rescanLibrary();
    }, [settings.videoLibraryFolders, isLoaded]);

    return (
        <VideoLibraryContext.Provider value={{
            library,
            movies: Object.values(library),
            isScanning,
            isLoaded,
            rescanLibrary,
            addFolderAndScan
        }}>
            {children}
        </VideoLibraryContext.Provider>
    );
}


export const useVideoLibrary = () => useContext(VideoLibraryContext);