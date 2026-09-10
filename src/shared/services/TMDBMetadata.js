import { BaseDirectory, mkdir, exists, writeFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { getFullImagePath, ImageSizes, TMDB_IMAGE_BASE_URL } from '@api-wrappers/tmdb-wrapper';
import { withRetry, sleep } from '../utils/GeneralUtils';

export const getPosterUrl = (posterPath) => {
    if (!posterPath) return null;
    return getFullImagePath(TMDB_IMAGE_BASE_URL, ImageSizes.ORIGINAL, posterPath);
};

export const downloadImage = async (url, localFileName) => {
    try {
        if (!url) return null;
        
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

export const downloadLogo = async (tmdb, tmdbId, isShow) => {
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

export const downloadMediaImages = async (tmdb, tmdbId, match, isShow) => {
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
            posterPath: getPosterUrl(details.poster_path),
            backdropPath: getPosterUrl(details.backdrop_path),
            logoPath: null,
            trailerKey: getTrailerKey(details.videos),
            cast: details.credits?.cast?.slice(0, 10).map(c => ({
                id: c.id,
                name: c.name,
                character: c.character,
                profilePath: getPosterUrl(c.profile_path)
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
                                stillPath: getPosterUrl(ep.still_path),
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
                        posterPath: getPosterUrl(season.poster_path),
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

            const { localPosterPath, localBackdropPath, localLogoPath } = await downloadMediaImages(tmdb, tmdbId, details, isShow);
            mediaItem.posterPath = localPosterPath || mediaItem.posterPath;
            mediaItem.backdropPath = localBackdropPath || mediaItem.backdropPath;
            mediaItem.logoPath = localLogoPath;
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
        posterPath: getPosterUrl(match.poster_path),
        backdropPath: getPosterUrl(match.backdrop_path),
        logoPath: null,
        voteAverage: match.vote_average,
        voteCount: match.vote_count
    };
};
