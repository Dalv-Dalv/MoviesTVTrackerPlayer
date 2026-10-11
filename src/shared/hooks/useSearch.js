import { useQuery } from "@tanstack/react-query";
import { useTMDB } from "./useTMDB";
import { useDebounce } from "./useDebounce";
import { getImageUrl, IMAGE_SIZES } from "../services/TMDBMetadata";
import { useGenres } from "../contexts/GenresContext";

export const useSearch = (query, searchType = 'all', debounceMs = 400) => {
    const tmdb = useTMDB();
    const { movieGenres, tvGenres } = useGenres();
    const debouncedSearch = useDebounce(query, debounceMs);

    const searchMap = {
        movies: 'movies',
        shows: 'tv',
        people: 'people',
        collections: 'collections',
        all: 'multi'
    };
    const method = searchMap[searchType] || 'multi';

    const trimmedQuery = debouncedSearch?.trim() || '';

    const { data: results = [], isLoading, isFetching } = useQuery({
        queryKey: ['search', method, trimmedQuery],
        queryFn: async () => {
            if (!trimmedQuery) return [];

            const res = await tmdb.search[method]({ query: trimmedQuery, language: 'en-US', page: 1 });
            if (!res?.results) return [];

            const formattedResults = res.results.map(item => {
                const formatted = { ...item };

                if (!formatted.media_type) {
                    if (searchType === 'movies') formatted.media_type = 'movie';
                    else if (searchType === 'shows') formatted.media_type = 'tv';
                    else if (searchType === 'people') formatted.media_type = 'person';
                    else if (searchType === 'collections') formatted.media_type = 'collection';
                }

                if (formatted.poster_path) formatted.poster_path = getImageUrl(formatted.poster_path, IMAGE_SIZES.poster);
                if (formatted.backdrop_path) formatted.backdrop_path = getImageUrl(formatted.backdrop_path, IMAGE_SIZES.backdrop);
                if (formatted.profile_path) formatted.profile_path = getImageUrl(formatted.profile_path, IMAGE_SIZES.person);

                const rDate = formatted.release_date || formatted.first_air_date;
                if (rDate) formatted.release_year = rDate?.split('-')[0] || 'Unknown Year';
                delete formatted.release_date;
                delete formatted.first_air_date;

                if (formatted.genre_ids) {
                    const dict = formatted.media_type === 'tv' ? tvGenres : movieGenres;
                    formatted.genres = formatted.genre_ids.map(id => dict[id]).filter(Boolean);
                    delete formatted.genre_ids;
                }

                return formatted;
            });

            formattedResults.sort((a, b) => {
                const q = trimmedQuery.toLowerCase();

                const getScore = (item) => {
                    const title = (item.title || item.name || '').toLowerCase();
                    const isExact = title === q;

                    let score = item.popularity || 0;

                    if (isExact) {
                        if ((item.vote_count && item.vote_count > 5) || score > 10) {
                            score *= 50;
                        } else {
                            score *= 1.5;
                        }
                    } else if (title.startsWith(q)) {
                        score *= 1.2;
                    }

                    if (item.release_year && !isNaN(item.release_year)) {
                        if (parseInt(item.release_year) > 2015) score *= 1.1;
                    }

                    return score;
                };

                return getScore(b) - getScore(a);
            });

            return formattedResults;
        },
        enabled: !!tmdb && !!trimmedQuery,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const isSearching = !!trimmedQuery && (isLoading || isFetching);
    const effectiveIsLoading = !!trimmedQuery && isLoading;

    return {
        results: trimmedQuery ? results : [],
        isSearching,
        isLoading: effectiveIsLoading,
        isFetching,
        debouncedSearch: trimmedQuery
    };
};