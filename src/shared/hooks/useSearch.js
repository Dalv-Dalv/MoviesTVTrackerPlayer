import { useEffect, useState } from "react";
import { useTMDB } from "./useTMDB";
import { useDebounce } from "./useDebounce";
import { getImageUrl, IMAGE_SIZES } from "../services/TMDBMetadata";
import { useGenres } from "../contexts/GenresContext";

export const useSearch = (query, searchType = 'all') => {
    const tmdb = useTMDB();
    const { movieGenres, tvGenres } = useGenres();
    const debouncedSearch = useDebounce(query, 400);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!debouncedSearch) {
            setResults([]);
            return;
        }

        let mounted = true;
        setIsSearching(true);

        const searchMap = {
            movies: 'movies',
            shows: 'tv',
            people: 'people',
            collections: 'collections',
            all: 'multi'
        };
        const method = searchMap[searchType] || 'multi';

        tmdb.search[method]({ query: debouncedSearch, language: 'en-US', page: 1 })
            .then(res => {
                if (mounted && res.results) {
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
                        const q = debouncedSearch.toLowerCase();

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

                    setResults(formattedResults);
                } else if (mounted) {
                    setResults([]);
                }
            })
            .catch(console.error)
            .finally(() => {
                if (mounted) setIsSearching(false);
            });

        return () => { mounted = false; };
    }, [debouncedSearch, searchType, tmdb]);

    return { results, isSearching, debouncedSearch };
};