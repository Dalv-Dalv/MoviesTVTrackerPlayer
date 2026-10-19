import { Modal } from './Modal';
import { useTMDB } from '../hooks/useTMDB';
import { useLibraryStore } from '../store/useLibraryStore';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '../hooks/useDebounce';
import parseVideo from 'video-name-parser';

import { MagnifyingGlassIcon, XIcon, CheckIcon } from '@phosphor-icons/react';


export function FixMatchModal({ isOpen, onClose, media, compId, navigate }) {
    const tmdb = useTMDB();
    const queryClient = useQueryClient();
    const updateMediaMatch = useLibraryStore(state => state.updateMediaMatch);

    const [searchQuery, setSearchQuery] = useState("");
    const debouncedQuery = useDebounce(searchQuery, 400);
    const [selectedResult, setSelectedResult] = useState(null);
    const [isSavingMatch, setIsSavingMatch] = useState(false);

    const { data: searchResults = [], isLoading: isQueryLoading, isFetching } = useQuery({
        queryKey: ['fixMatchSearch', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery.trim()) return [];
            try {
                const search = await tmdb.search.multi({
                    query: debouncedQuery.trim(),
                    language: "en-US",
                    page: 1
                });
                return (search?.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
            } catch (err) {
                console.error("Failed to search TMDB for fix match:", err);
                return [];
            }
        },
        enabled: isOpen && !!tmdb && !!debouncedQuery.trim(),
    });

    const isSearching = !!searchQuery.trim() && (isQueryLoading || isFetching || searchQuery !== debouncedQuery);

    useEffect(() => {
        if (isOpen) {
            let initialQuery = media?.title || "";
            let firstFilePath = null;

            if (media?.filePaths?.length > 0) {
                firstFilePath = media.filePaths[0];
            } else if (media?.type === 'show') {
                if (media.seasons) {
                    for (const s of (media.seasons || []).filter(Boolean)) {
                        if (s.episodes) {
                            for (const e of (s.episodes || []).filter(Boolean)) {
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
                    for (const e of (media.specials.episodes || []).filter(Boolean)) {
                        if (e.filePaths && e.filePaths.length > 0) {
                            firstFilePath = e.filePaths[0];
                            break;
                        }
                    }
                }
            }

            if (firstFilePath) {
                try {
                    const filename = firstFilePath.split(/[\\/]/).pop();
                    const parsed = parseVideo(filename);
                    if (parsed?.name) {
                        initialQuery = parsed.name;
                    }
                } catch {
                    // Fall back to existing title
                }
            }

            setSearchQuery(initialQuery);
            setSelectedResult(null);
        }
    }, [isOpen, media]);



    const handleConfirmMatch = async () => {
        if (!selectedResult) return;

        setIsSavingMatch(true);
        try {
            const newCompId = await updateMediaMatch(tmdb, compId, selectedResult);
            queryClient.invalidateQueries({ queryKey: ['mediaDetails'] });
            onClose();
            navigate(`/details/${newCompId}`, { replace: true });
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingMatch(false);
        }
    };

    const inputRef = useRef(null);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Fix Match">
            <div className="flex flex-col gap-4">
                <div
                    onClick={() => inputRef.current?.focus()}
                    className='bg-black/20 border border-divider rounded-lg px-4 py-3 focus-within:border-primary transition-colors flex items-center gap-3 cursor-text'
                >
                    <MagnifyingGlassIcon size={22} weight='bold' className='text-muted shrink-0' />

                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for movie or TV show..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full text-body bg-transparent outline-none border-none text-sm sm:text-base placeholder:text-muted"
                    />

                    {searchQuery && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery("");
                                setSelectedResult(null);
                                inputRef.current?.focus();
                            }}
                            className="text-muted hover:text-body p-1 rounded transition-colors shrink-0 cursor-pointer"
                        >
                            <XIcon size={18} weight="bold" />
                        </button>
                    )}
                </div>

                <div className="overflow-y-auto noScrollbar rounded-lg border border-divider bg-black/20 flex flex-col h-64 sm:h-72 -mt-2">
                    {isSearching ? (
                        <div className="m-auto text-muted">Searching...</div>
                    ) : !searchQuery.trim() ? (
                        <div className="m-auto text-muted text-sm text-center px-4">Type to search for a movie or TV show.</div>
                    ) : searchResults.length === 0 ? (
                        <div className="m-auto text-muted text-sm text-center px-4">No results found on TMDB.</div>
                    ) : (
                        searchResults.map(result => {
                            const isSelected = selectedResult?.id === result.id;
                            const title = result.title || result.name;
                            const year = result.release_date?.substring(0, 4) || result.first_air_date?.substring(0, 4) || 'Unknown';
                            const typeLabel = result.media_type === 'tv' ? 'TV Show' : 'Movie';

                            return (
                                <div
                                    key={result.id}
                                    onClick={() => setSelectedResult(result)}
                                    className={`flex items-center gap-3 sm:gap-4 p-3 cursor-pointer transition-all border-b border-divider/50 last:border-b-0 ${
                                        isSelected ? 'bg-primary/20 ring-1 ring-inset ring-primary' : 'hover:bg-white/5'
                                    }`}
                                >
                                    {result.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                                            alt={title}
                                            className="w-11 sm:w-12 rounded object-cover aspect-2/3 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-11 sm:w-12 bg-white/5 rounded aspect-2/3 shrink-0 flex items-center justify-center text-[10px] text-muted border border-white/5">
                                            No Img
                                        </div>
                                    )}
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-semibold text-body truncate text-sm sm:text-base">{title}</span>
                                        <span className="text-muted text-xs sm:text-sm truncate">
                                            {year} • {typeLabel}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-primary text-background flex items-center justify-center shrink-0">
                                            <CheckIcon size={14} weight="bold" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex gap-3 justify-end pt-1">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-divider transition-colors cursor-pointer text-sm font-medium">Cancel</button>
                    <button
                        onClick={handleConfirmMatch}
                        disabled={!selectedResult || isSavingMatch}
                        className="px-4 py-2 bg-body text-black rounded-lg font-semibold hover:bg-body/70 transition-colors disabled:opacity-50 cursor-pointer text-sm"
                    >
                        {isSavingMatch ? 'Saving...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
