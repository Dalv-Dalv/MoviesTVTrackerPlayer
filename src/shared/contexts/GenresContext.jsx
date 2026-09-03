import { load } from "@tauri-apps/plugin-store";
import { createContext, useContext, useEffect, useState } from "react";
import { useTMDB } from "../hooks/useTMDB";

const GenresContext = createContext();

export function GenresProvider({ children }) {
    const [movieGenres, setMovieGenres] = useState({});
    const [tvGenres, setTvGenres] = useState({});
    const [isGenresLoaded, setIsGenresLoaded] = useState(false);

    const tmdb = useTMDB();

    useEffect(() => {
        async function initAndLoadGenres() {
            try {
                const store = await load('genres.json', { autoSave: true });

                let cachedMovieGenres = await store.get('movieGenres');
                let cachedTvGenres = await store.get('tvGenres');

                if (!cachedMovieGenres || Object.keys(cachedMovieGenres).length === 0 ||
                    !cachedTvGenres || Object.keys(cachedTvGenres).length === 0) {

                    console.log("Fetching genres from TMDB...");
                    const [moviesRes, tvRes] = await Promise.all([
                        tmdb.genre.movies({ language: 'en-US' }).catch(() => tmdb.genre.movies()),
                        tmdb.genre.tv({ language: 'en-US' }).catch(() => tmdb.genre.tv())
                    ]);

                    cachedMovieGenres = {};
                    if (moviesRes && moviesRes.genres) {
                        moviesRes.genres.forEach(g => { cachedMovieGenres[g.id] = g.name; });
                    }

                    cachedTvGenres = {};
                    if (tvRes && tvRes.genres) {
                        tvRes.genres.forEach(g => { cachedTvGenres[g.id] = g.name; });
                    }

                    await store.set('movieGenres', cachedMovieGenres);
                    await store.set('tvGenres', cachedTvGenres);
                    await store.save();
                }

                setMovieGenres(cachedMovieGenres || {});
                setTvGenres(cachedTvGenres || {});
            } catch (error) {
                console.error("Failed to load or fetch genres:", error);
            } finally {
                setIsGenresLoaded(true);
            }
        }

        initAndLoadGenres();
    }, [tmdb]);

    if (!isGenresLoaded) return <div className="h-screen w-screen bg-background" />;

    return (
        <GenresContext.Provider value={{ movieGenres, tvGenres, isGenresLoaded }}>
            {children}
        </GenresContext.Provider>
    );
}

export const useGenres = () => useContext(GenresContext);
