import { BaseDirectory, mkdir, exists, writeFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { getFullImagePath, ImageSizes, TMDB_IMAGE_BASE_URL } from '@api-wrappers/tmdb-wrapper';
import { withRetry, sleep } from '../utils/GeneralUtils';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

export const IMAGE_SIZES = {
    poster: "w342",
    backdrop: "w1280",
    logo: "w500",
    full: "original"
};

export const getImageFilename = (tmdbId, type, isFull, imagePath = '') => {
    const size = isFull ? "Original" : IMAGE_SIZES[type.toLowerCase()].toUpperCase();
    let ext = type.toLowerCase() === 'logo' ? 'png' : 'jpg';
    
    if (imagePath) {
        const parts = imagePath.split('.');
        if (parts.length > 1) {
            const parsedExt = parts.pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(parsedExt)) {
                ext = parsedExt;
            }
        }
    }
    
    return `${tmdbId}_${type.charAt(0).toUpperCase() + type.slice(1)}_${size}.${ext}`;
};

export const getImageUrl = (imagePath, size = "original") => {
    if (!imagePath) return null;
    return getFullImagePath(TMDB_IMAGE_BASE_URL, size, imagePath);
};

export const getAllImages = async (tmdb, tmdbId, isShow) => {
    try {
        const tmdbApi = isShow ? tmdb.tvShows : tmdb.movies;

        const imagesData = await withRetry(() => tmdbApi.images(tmdbId, {
            include_image_language: ["en", "null"]
        }));

        if (!imagesData) return null;

        return {
            backdrops: imagesData.backdrops.map((e) => ({full: getImageUrl(e.file_path), half: getImageUrl(e.file_path, "w780"), key: e.file_path})),
            logos: imagesData.logos.map((e) => ({full: getImageUrl(e.file_path), half: getImageUrl(e.file_path, "w500"), key: e.file_path})),
            posters: imagesData.posters.map((e) => ({full: getImageUrl(e.file_path), half: getImageUrl(e.file_path, "w342"), key: e.file_path})),
        }
    } catch (imageError) {
        console.error(`Failed to fetch extra images for ${tmdbId}:`, imageError);
    }
    return null;
};

export const downloadImage = async (url, localFileName) => {
    try {
        if (!url) return null;

        if (!(await exists('images', { baseDir: BaseDirectory.AppData }))) {
            await mkdir('images', { baseDir: BaseDirectory.AppData });
        }

        const response = await tauriFetch(url);
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

export const downloadLogo = async (tmdb, tmdbId, isShow) => {
    try {
        const tmdbApi = isShow ? tmdb.tvShows : tmdb.movies;

        const imagesData = await withRetry(() => tmdbApi.images(tmdbId, {
            include_image_language: ["en", "null"]
        }));

        if (!imagesData || !imagesData.logos || imagesData.logos.length <= 0) return { localPath: null, localPathFull: null, rawPath: null };

        const logoPath = imagesData.logos[0].file_path;
        const localPath = await downloadImage(getImageUrl(logoPath, "w500"), getImageFilename(tmdbId, 'logo', false, logoPath));
        const localPathFull = await downloadImage(getImageUrl(logoPath, "original"), getImageFilename(tmdbId, 'logo', true, logoPath));
        return { localPath, localPathFull, rawPath: logoPath };
    } catch (imageError) {
        console.error(`Failed to fetch extra images for ${tmdbId}:`, imageError);
    }
    return { localPath: null, localPathFull: null, rawPath: null };
};

export const downloadMediaImages = async (tmdb, tmdbId, match, isShow) => {
    let localPosterPath = null;
    let localPosterPathFull = null;
    if (match.poster_path) {
        localPosterPath = await downloadImage(getImageUrl(match.poster_path, "w500"), getImageFilename(tmdbId, 'poster', false, match.poster_path));
        localPosterPathFull = await downloadImage(getImageUrl(match.poster_path, "original"), getImageFilename(tmdbId, 'poster', true, match.poster_path));
    }

    let localBackdropPath = null;
    let localBackdropPathFull = null;
    if (match.backdrop_path) {
        localBackdropPath = await downloadImage(getImageUrl(match.backdrop_path, "w1280"), getImageFilename(tmdbId, 'backdrop', false, match.backdrop_path));
        localBackdropPathFull = await downloadImage(getImageUrl(match.backdrop_path, "original"), getImageFilename(tmdbId, 'backdrop', true, match.backdrop_path));
    }

    let logoData = await downloadLogo(tmdb, tmdbId, isShow);

    return { 
        localPosterPath, localPosterPathFull, 
        localBackdropPath, localBackdropPathFull, 
        localLogoPath: logoData.localPath, 
        localLogoPathFull: logoData.localPathFull,
        rawLogoUrl: logoData.rawPath 
    };
};

const getTrailerKey = (videos) => {
    if (!videos || !videos.results) return null;
    const trailers = videos.results.filter(v => v.site === "YouTube" && v.type === "Trailer");
    return trailers.length > 0 ? trailers[0].key : null;
};

export const fetchDetailedMetadata = async (tmdb, tmdbId, type, isLocalScan = false) => {
    const isShow = type === "show";

    try {
        const details = await withRetry(() => isShow
            ? tmdb.tvShows.details(tmdbId, ["videos", "images", "credits"])
            : tmdb.movies.details(tmdbId, ["videos", "images", "credits"])
        );

        const mediaItem = {
            tmdbId: tmdbId.toString(),
            type: isShow ? 'show' : 'movie',
            isDownloaded: isLocalScan,
            isFullyLoaded: true,
            title: details.title || details.name,
            overview: details.overview,
            releaseDate: details.release_date || details.first_air_date,
            genreIds: details.genres ? details.genres.map(g => g.id) : [],
            tagline: details.tagline,
            voteAverage: details.vote_average,
            voteCount: details.vote_count,
            status: details.status,
            posterPath: getImageUrl(details.poster_path, "w500"),
            posterPathFull: getImageUrl(details.poster_path, "original"),
            rawPosterUrl: details.poster_path || null,
            backdropPath: getImageUrl(details.backdrop_path, "w780"),
            backdropPathFull: getImageUrl(details.backdrop_path, "original"),
            rawBackdropUrl: details.backdrop_path || null,
            logoPath: null,
            logoPathFull: null,
            rawLogoUrl: null,
            trailerKey: getTrailerKey(details.videos),
            cast: details.credits?.cast?.map(c => ({
                id: c.id,
                name: c.name,
                character: c.character,
                profilePath: getImageUrl(c.profile_path, "h632"),
                profilePathFull: getImageUrl(c.profile_path, "original")
            })) || [],
            directors: details.credits?.crew?.filter(c => c.job === "Director" || c.job === "Creator").map(c => ({
                name: c.name,
                job: c.job
            })) || [],
        };

        if (!isShow) {
            mediaItem.runtime = details.runtime;
            mediaItem.filePaths = [];
        } else {
            let totalRuntime = 0;
            let totalEpisodes = 0;
            mediaItem.seasons = [];
            mediaItem.specials = null;

            if (details.seasons && details.seasons.length > 0) {
                for (const season of details.seasons) {
                    const seasonNumber = season.season_number;

                    const seasonDetails = await withRetry(() => tmdb.tvSeasons.details({ tvShowID: tmdbId, seasonNumber: seasonNumber }));

                    const episodes = [];
                    if (seasonDetails.episodes) {
                        for (const ep of seasonDetails.episodes) {
                            episodes[ep.episode_number - 1] = {
                                number: ep.episode_number,
                                name: ep.name,
                                overview: ep.overview,
                                stillPath: getImageUrl(ep.still_path, "w300"),
                                stillPathFull: getImageUrl(ep.still_path, "original"),
                                airDate: ep.air_date,
                                runtime: ep.runtime,
                                voteAverage: ep.vote_average,
                                filePaths: [],
                                isDownloaded: false
                            };

                            totalRuntime += ep.runtime;
                            totalEpisodes++;
                        }
                    }
                    const seasonData = {
                        number: seasonNumber,
                        name: season.name,
                        overview: season.overview,
                        posterPath: getImageUrl(season.poster_path, "w500"),
                        episodes: episodes
                    };

                    if (seasonNumber === 0) {
                        mediaItem.specials = seasonData;
                    } else {
                        mediaItem.seasons[seasonNumber - 1] = seasonData;
                    }

                    await sleep(200);
                }
            }

            mediaItem.avgRuntime = totalRuntime / totalEpisodes;
            mediaItem.totalEpisodes = totalEpisodes;
        }

        if (isLocalScan) {
            //TODO: Check if its a show and check settings for wether or not to download episode thumbnails too

            const { localPosterPath, localPosterPathFull, localBackdropPath, localBackdropPathFull, localLogoPath, localLogoPathFull, rawLogoUrl } = await downloadMediaImages(tmdb, tmdbId, details, isShow);
            mediaItem.posterPath = localPosterPath || mediaItem.posterPath;
            mediaItem.posterPathFull = localPosterPathFull || mediaItem.posterPathFull;
            mediaItem.backdropPath = localBackdropPath || mediaItem.backdropPath;
            mediaItem.backdropPathFull = localBackdropPathFull || mediaItem.backdropPathFull;
            mediaItem.logoPath = localLogoPath;
            mediaItem.logoPathFull = localLogoPathFull;
            mediaItem.rawLogoUrl = rawLogoUrl;
        }

        return mediaItem;

    } catch (error) {
        console.error(`Failed to fetch detailed metadata for ${type} ${tmdbId}:`, error);
        throw error;
    }
};

export const extractBasicMetadata = (match, type = null) => {
    if (!match) return null;

    const isShow = type === 'show' || match.media_type === "tv";

    return {
        tmdbId: match.id.toString(),
        type: isShow ? 'show' : 'movie',
        isDownloaded: false,
        isFullyLoaded: false,
        title: match.title || match.name,
        genreIds: match.genre_ids || [],
        releaseDate: match.release_date || match.first_air_date,
        overview: match.overview,
        posterPath: getImageUrl(match.poster_path, "w500"),
        rawPosterUrl: match.poster_path || null,
        backdropPath: getImageUrl(match.backdrop_path, "w780"),
        rawBackdropUrl: match.backdrop_path || null,
        logoPath: null,
        logoPathFull: null,
        rawLogoUrl: null,
        voteAverage: match.vote_average,
        voteCount: match.vote_count
    };
};
