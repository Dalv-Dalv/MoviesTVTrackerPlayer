import parseVideo from 'video-name-parser';
import { open } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, readDir, readTextFile, writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory, basename, join } from '@tauri-apps/api/path';
import { useTMDB } from '../../shared/hooks/useTMDB';
import { getFullImagePath, ImageSizes, TMDB_IMAGE_BASE_URL } from '@api-wrappers/tmdb-wrapper';

const VIDEO_EXTENSIONS = ['.mkv', '.mp4', '.avi', '.webm', '.mov'];
const CACHE_FILE = 'library_cache.json';

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
                const isVideo = VIDEO_EXTENSIONS.some(ext =>
                    entry.name.toLowerCase().endsWith(ext)
                );

                if (isVideo) {
                    foundVideos.push(fullPath);
                }
            }
        }
    } catch (error) {
        console.error(`Failed to read directory ${dirPath}:`, error);
    }

    return foundVideos;
};

const getPosterUrl = (posterPath) => {
    if (!posterPath) return null;
    return getFullImagePath(TMDB_IMAGE_BASE_URL, ImageSizes.ORIGINAL, posterPath);
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

export const handleScanLibrary = async () => {
    const selectedFolder = await open({
        directory: true,
        multiple: false,
    });

    if (!selectedFolder) return;

    const videoPaths = await scanDirectory(selectedFolder);

    const parsedVideos = await Promise.all(
        videoPaths.map(async (path) => {
            const fileName = await basename(path);
            const parsed = parseVideo(fileName);
            return parsed;
        })
    );

    console.log(parsedVideos);

    let libraryCache = {};
    const cacheExists = await exists(CACHE_FILE, { baseDir: BaseDirectory.AppData });

    if (cacheExists) {
        const cacheData = await readTextFile(CACHE_FILE, { baseDir: BaseDirectory.AppData });
        libraryCache = JSON.parse(cacheData);
    }

    const tmdb = useTMDB();
    const newCache = {};
    const newlyDiscoveredVideos = [];

    
    for (const video of parsedVideos) {
        if (video.type === 'series') continue; //TODO: Handle shows
        
        if (libraryCache[video.name]) {
            newCache[video.name] = libraryCache[video.name];
            continue;
        }
        
        try {
            const search = await tmdb.search.movies({
                query: video.name,
                primary_release_year: video.year,
                language: "en-US",
                page: 1
            });
            
            const match = search.results[0];
            if (!match) continue; //TODO: Handle properly
            
            let localPosterPath = null;
            if (match.poster_path) {
                const fullUrl = getPosterUrl(match.poster_path);
                const imageFilename = `Poster_${match.id}.jpg`;
                localPosterPath = await downloadImage(fullUrl, imageFilename);
            }
            
            let localBackdropPath = null;
            if (match.backdrop_path) {
                const fullUrl = getPosterUrl(match.backdrop_path);
                const imageFilename = `Backdrop_${match.id}.jpg`;
                localBackdropPath = await downloadImage(fullUrl, imageFilename);
            }
            
            const movieData = {
                tmdbId: match.id,
                title: match.title,
                genreIds: match.genre_ids,
                releaseDate: match.release_date,
                overview: match.overview,
                posterPath: localPosterPath,
                backdropPath: localBackdropPath
            };
            
            newCache[video.name] = movieData;
            newlyDiscoveredVideos.push(video.name);
        } catch (error) {
            console.error(`TMDB search failed for ${video.name}`, error);
        }
    }
    
    const oldKeys = Object.keys(libraryCache);
    const currentVideoNames = parsedVideos.map(v => v.name);
    for (const oldKey of oldKeys) {
        if (currentVideoNames.includes(oldKey)) continue;

        console.log(`Removing orphaned entry: ${oldKey}`);
        
        const oldData = libraryCache[oldKey];

        if (oldData.posterPath) {
            try {
                await remove(oldData.posterPath, { baseDir: BaseDirectory.AppData });
            } catch (e) {
                console.warn(`Failed to remove old poster ${oldData.posterPath}:`, e);
            }
        }

        if (oldData.backdropPath) {
            try {
                await remove(oldData.backdropPath, { baseDir: BaseDirectory.AppData });
            } catch (e) {
                console.warn(`Failed to remove old backdrop ${oldData.backdropPath}:`, e);
            }
        }
    }

    await writeTextFile(
        CACHE_FILE, 
        JSON.stringify(newCache, null, 2), 
        { baseDir: BaseDirectory.AppData }
    );

    return newCache;
};