import { Modal } from './Modal';
import { useTMDB } from '../hooks/useTMDB';
import { useLibraryStore } from '../store/useLibraryStore';
import { useState, useEffect, useRef } from 'react';
import parseVideo from 'video-name-parser';

import { MagnifyingGlassIcon } from '@phosphor-icons/react';


export function FixMatchModal({ isOpen, onClose, media, tmdbId, navigate }) {
    const tmdb = useTMDB();
    const updateMediaMatch = useLibraryStore(state => state.updateMediaMatch);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const [isSavingMatch, setIsSavingMatch] = useState(false);

    useEffect(() => {
        if (isOpen) {
            let initialQuery = media?.title || "";
            let firstFilePath = null;

            if (media?.filePaths?.length > 0) {
                firstFilePath = media.filePaths[0];
            } else if (media?.type === 'show') {
                if (media.seasons) {
                    for (const s of media.seasons) {
                        if (s.episodes) {
                            for (const e of s.episodes) {
                                if (e.filePaths && e.filePaths.length > 0) {
                                    firstFilePath = e.filePaths[0];
                                    break;
                                }
                            }
                        }
                        if (firstFilePath) break;
                    }
                }
                if (!firstFilePath && media.specials && media.specials.episodes) {
                    for (const e of media.specials.episodes) {
                        if (e.filePaths && e.filePaths.length > 0) {
                            firstFilePath = e.filePaths[0];
                            break;
                        }
                    }
                }
            }

            if (firstFilePath) {
                const filename = firstFilePath.split(/[\\/]/).pop();
                const parsed = parseVideo(filename);
                initialQuery = parsed.name || initialQuery;
            }

            setSearchQuery(initialQuery);
            setSearchResults([]);
            setSelectedResult(null);
        }
    }, [isOpen, media]);

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const search = await tmdb.search.multi({
                    query: searchQuery,
                    language: "en-US",
                    page: 1
                });
                const filtered = (search.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
                setSearchResults(filtered);
            } catch (err) {
                console.error("Failed to search TMDB:", err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, isOpen, tmdb]);

    const handleConfirmMatch = async () => {
        if (!selectedResult) return;

        setIsSavingMatch(true);
        try {
            const newTmdbId = await updateMediaMatch(tmdb, tmdbId, selectedResult);
            onClose();
            navigate(`/details/${newTmdbId}`, { replace: true });
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingMatch(false);
        }
    };

    const inputRef = useRef(null);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Fix Match">
            <div className="flex flex-col gap-4 max-h-[80vh]">
                <div 
                    onClick={() => inputRef.current?.focus()}
                    className='bg-black/20 border border-divider rounded-lg px-4 py-3 focus-within:border-primary transition-colors flex items-center gap-4 cursor-text'
                >
                    <MagnifyingGlassIcon size={24} weight='bold' className='text-muted'/>
                    
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Search for movie or TV show..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full text-body bg-transparent outline-none border-none"
                    />
                </div>

                <div className="flex-1 overflow-y-auto noScrollbar rounded-lg border border-divider bg-black/20 flex flex-col min-h-64 h-64 -mt-2">
                    {isSearching ? (
                        <div className="m-auto text-muted">Searching...</div>
                    ) : searchResults.length === 0 ? (
                        <div className="m-auto text-muted">No results found.</div>
                    ) : (
                        searchResults.map(result => (
                            <div 
                                key={result.id}
                                onClick={() => setSelectedResult(result)}
                                className={`flex items-center gap-4 p-3 cursor-pointer transition-colors ${selectedResult?.id === result.id ? 'bg-primary/20' : 'hover:bg-white/5'}`}
                            >
                                {result.poster_path ? (
                                    <img src={`https://image.tmdb.org/t/p/w92${result.poster_path}`} alt="" className="w-12 rounded object-cover aspect-2/3 shrink-0" />
                                ) : (
                                    <div className="w-12 bg-white/5 rounded aspect-2/3 shrink-0" />
                                )}
                                <div className="flex flex-col">
                                    <span className="font-semibold text-body line-clamp-1">{result.title || result.name}</span>
                                    <span className="text-muted text-sm">{result.release_date?.substring(0, 4) || result.first_air_date?.substring(0, 4) || 'Unknown'} • {result.media_type === 'tv' ? 'TV Show' : 'Movie'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex gap-4 justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-divider transition-colors cursor-pointer">Cancel</button>
                    <button 
                        onClick={handleConfirmMatch} 
                        disabled={!selectedResult || isSavingMatch}
                        className="px-4 py-2 bg-body text-black rounded-lg font-semibold hover:bg-body/70 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {isSavingMatch ? 'Saving...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
