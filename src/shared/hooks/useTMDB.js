import { TMDB } from "@api-wrappers/tmdb-wrapper";

const tmdb = new TMDB({ apiKey: import.meta.env.VITE_TMDB_API_KEY });

export const useTMDB = () => tmdb;