import { useInfiniteQuery } from "@tanstack/react-query";
import { useTMDB } from "./useTMDB";
import { useDebounce } from "./useDebounce";
import { getImageUrl, IMAGE_SIZES } from "../services/TMDBMetadata";
import { useGenres } from "../contexts/GenresContext";
import { useMemo } from "react";

const SEARCH_MAP = {
    movies: 'movies',
    shows: 'tv',
    people: 'people',
    collections: 'collections',
    all: 'multi'
};

const DEFAULT_MEDIA_TYPE = {
    movies: 'movie',
    shows: 'tv',
    people: 'person',
    collections: 'collection'
};

const MEDIA_TYPE_TO_CATEGORY = {
    movie: 'movies',
    tv: 'shows',
    person: 'people',
    collection: 'collections'
};

export function getSearchItemPath(item) {
    const mediaType = item.media_type === 'tv' ? 'show' : item.media_type;
    return `/details/${mediaType}_${item.id}`;
}

function formatRawSearchItem(item, fallbackType) {
    const formatted = { ...item };

    if (!formatted.media_type && fallbackType) {
        formatted.media_type = fallbackType;
    }

    if (formatted.poster_path) {
        formatted.poster_path = getImageUrl(formatted.poster_path, IMAGE_SIZES.poster);
    }
    if (formatted.backdrop_path) {
        formatted.backdrop_path = getImageUrl(formatted.backdrop_path, IMAGE_SIZES.backdrop);
    }
    if (formatted.profile_path) {
        formatted.profile_path = getImageUrl(formatted.profile_path, IMAGE_SIZES.person);
    }

    const rDate = formatted.release_date || formatted.first_air_date;
    if (rDate) {
        formatted.release_year = rDate.split('-')[0] || 'Unknown Year';
    }
    delete formatted.release_date;
    delete formatted.first_air_date;

    return formatted;
}

function scoreSearchItem(item, normalizedQuery) {
    const title = (item.title || item.name || '').toLowerCase();
    const isExact = title === normalizedQuery;

    let score = item.popularity || 0;

    if (isExact) {
        score *= (item.vote_count > 5 || score > 10) ? 50 : 1.5;
    } else if (title.startsWith(normalizedQuery)) {
        score *= 1.2;
    }

    const year = Number.parseInt(item.release_year, 10);
    if (!Number.isNaN(year) && year > 2015) {
        score *= 1.1;
    }

    return score;
}

export const useSearch = (query, searchType = 'all', debounceMs = 400) => {
    const tmdb = useTMDB();
    const { movieGenres, tvGenres } = useGenres();
    const debouncedSearch = useDebounce(query, debounceMs);

    const activeQuery = debounceMs > 0 ? debouncedSearch : query;
    const trimmedQuery = activeQuery?.trim() || '';

    const method = SEARCH_MAP[searchType] || 'multi';
    const fallbackType = DEFAULT_MEDIA_TYPE[searchType];

    const queryResult = useInfiniteQuery({
        // Distinct key prevents colliding with old non-infinite useQuery cache entries
        queryKey: ['search-infinite', method, trimmedQuery],
        queryFn: async ({ pageParam = 1 }) => {
            if (!trimmedQuery) {
                return { items: [], page: 1, totalPages: 0, totalResults: 0 };
            }

            const res = await tmdb.search[method]({
                query: trimmedQuery,
                language: 'en-US',
                page: pageParam
            });

            if (!res?.results) {
                return { items: [], page: pageParam, totalPages: 0, totalResults: 0 };
            }

            const items = res.results.map((item) => formatRawSearchItem(item, fallbackType));

            if (pageParam === 1) {
                const q = trimmedQuery.toLowerCase();
                items.sort((a, b) => scoreSearchItem(b, q) - scoreSearchItem(a, q));
            }

            return {
                items,
                page: pageParam,
                totalPages: res.total_pages || 1,
                totalResults: res.total_results || 0
            };
        },
        getNextPageParam: (lastPage) =>
            lastPage?.page < lastPage?.totalPages ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
        enabled: !!tmdb && !!trimmedQuery,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
    });

    const items = useMemo(() => {
        if (!trimmedQuery || !Array.isArray(queryResult.data?.pages)) return [];

        const seen = new Set();
        const list = [];

        for (const page of queryResult.data.pages) {
            if (!Array.isArray(page?.items)) continue;

            for (const item of page.items) {
                const key = `${item.media_type}_${item.id}`;
                if (seen.has(key)) continue;
                seen.add(key);

                if (item.genre_ids) {
                    const dict = item.media_type === 'tv' ? tvGenres : movieGenres;
                    const genres = item.genre_ids.map((id) => dict?.[id]).filter(Boolean);
                    list.push({ ...item, genres });
                } else {
                    list.push(item);
                }
            }
        }

        return list;
    }, [trimmedQuery, queryResult.data, movieGenres, tvGenres]);

    const totalResults = queryResult.data?.pages?.[0]?.totalResults ?? 0;
    const effectiveIsLoading = !!trimmedQuery && queryResult.isLoading;
    const isSearching =
        !!trimmedQuery &&
        (queryResult.isLoading || (queryResult.isFetching && !queryResult.isFetchingNextPage && items.length === 0));

    return {
        ...queryResult,
        results: items,
        items,
        totalResults,
        isSearching,
        isLoading: effectiveIsLoading,
        debouncedSearch: trimmedQuery
    };
};

export function useTopHitCategory(query) {
    const { results, isLoading } = useSearch(query, 'all', 0);

    const topHitCategory = useMemo(() => {
        if (!results.length) return null;
        return MEDIA_TYPE_TO_CATEGORY[results[0].media_type] || 'movies';
    }, [results]);

    return { topHitCategory, isLoading };
}