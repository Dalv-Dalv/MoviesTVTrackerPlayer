import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLibraryStore } from '../../shared/store/useLibraryStore';
import { useTMDB } from '../../shared/hooks/useTMDB';
import { MagnifyingGlassIcon, CheckCircleIcon, XIcon, FolderIcon, CaretDownIcon, CaretLeftIcon, CheckSquareIcon, MinusSquareIcon, SquareIcon } from '@phosphor-icons/react';
import { getFullImagePath, ImageSizes, TMDB_IMAGE_BASE_URL } from '@api-wrappers/tmdb-wrapper';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { AnimatePresence, motion } from 'framer-motion';

export default function LibraryManagerPage() {
    const library = useLibraryStore(state => state.library);
    const applyBulkRematch = useLibraryStore(state => state.applyBulkRematch);
    const tmdb = useTMDB();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [stagedChanges, setStagedChanges] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    const { data: searchResults = [], isLoading: isQueryLoading, isFetching } = useQuery({
        queryKey: ['libraryManagerSearch', debouncedSearch],
        queryFn: async () => {
            if (!debouncedSearch.trim()) return [];
            try {
                const res = await tmdb.search.multi({ query: debouncedSearch.trim(), language: 'en-US', page: 1 });
                return res.results || [];
            } catch (err) {
                console.error("Library manager search error:", err);
                return [];
            }
        },
        enabled: !!tmdb && !!debouncedSearch.trim(),
    });

    const isSearching = !!searchQuery.trim() && (isQueryLoading || isFetching || searchQuery !== debouncedSearch);

    const [isSaving, setIsSaving] = useState(false);

    const groups = useMemo(() => {
        const stagedPaths = new Set(stagedChanges.flatMap(c => c.filePaths));

        return Object.entries(library).map(([compId, item]) => {
            let itemPaths = [];
            if (item.type === 'movie') {
                itemPaths = item.filePaths || [];
            } else if (item.type === 'show') {
                if (item.seasons) {
                    for (const s of (item.seasons || []).filter(Boolean)) {
                        if (s.episodes) {
                            for (const e of (s.episodes || []).filter(Boolean)) {
                                itemPaths.push(...(e.filePaths || []));
                            }
                        }
                    }
                }
                if (item.specials && item.specials.episodes) {
                    for (const e of (item.specials.episodes || []).filter(Boolean)) {
                        itemPaths.push(...(e.filePaths || []));
                    }
                }
            }

            return {
                ...item,
                compId,
                filePaths: itemPaths.filter(p => !stagedPaths.has(p))
            };
        }).filter(item => item.filePaths.length > 0);
    }, [library, stagedChanges]);



    const toggleFileSelection = (path) => {
        setSelectedFiles(prev =>
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
        );
    };

    const toggleGroupSelection = (paths) => {
        const allSelected = paths.every(p => selectedFiles.includes(p));
        if (allSelected) {
            setSelectedFiles(prev => prev.filter(p => !paths.includes(p)));
        } else {
            setSelectedFiles(prev => [...new Set([...prev, ...paths])]);
        }
    };

    const stageSelection = (match) => {
        if (selectedFiles.length === 0) return;

        setStagedChanges(prev => {
            const existingIndex = prev.findIndex(c => c.match.id === match.id && c.match.media_type === match.media_type);

            if (existingIndex >= 0) {
                const newStaged = [...prev];
                const newPaths = [...new Set([...newStaged[existingIndex].filePaths, ...selectedFiles])];
                newStaged[existingIndex] = { ...newStaged[existingIndex], filePaths: newPaths };
                return newStaged;
            } else {
                return [
                    ...prev,
                    { match, filePaths: [...selectedFiles] }
                ];
            }
        });

        setSelectedFiles([]);
        setSearchQuery('');
    };

    const removeStagedChange = (index) => {
        setStagedChanges(prev => prev.filter((_, i) => i !== index));
    };

    const saveChanges = async () => {
        if (stagedChanges.length === 0) return;
        setIsSaving(true);
        try {
            await applyBulkRematch(tmdb, stagedChanges);
            queryClient.invalidateQueries({ queryKey: ['mediaDetails'] });
            setStagedChanges([]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Top Bar */}
            <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-white/10 shrink-0">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted hover:text-body cursor-pointer"
                >
                    <CaretLeftIcon size={24} weight="bold" />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-body tracking-wide">Advanced Library Management</h1>
                    <p className="text-muted text-xs sm:text-sm mt-1">Audit miscategorized files and rematch them to the correct TMDB entries.</p>
                </div>
            </div>

            <div className="flex flex-1 flex-col md:flex-row overflow-hidden min-h-0">
                {/* Left Panel */}
                <div className="flex-1 flex flex-col md:border-r border-b md:border-b-0 border-white/10 overflow-hidden bg-white/5">

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {/* Staged Changes Section */}
                        {stagedChanges.length > 0 && (
                            <div className="flex flex-col gap-3 mb-2 shrink-0">
                                <h3 className="text-primary font-bold tracking-wide uppercase text-sm">
                                    Staged Changes
                                </h3>

                                {stagedChanges.map((change, index) => (
                                    <div key={index} className="bg-primary/10 border border-primary/20 rounded-xl p-4 shrink-0 shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="font-bold text-body text-base flex items-center gap-3">
                                                <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs tracking-wider">NEW MATCH</span>
                                                {change.match.title || change.match.name}
                                            </div>
                                            <button onClick={() => removeStagedChange(index)} className="text-danger-500 hover:text-danger-400 p-1 transition-colors cursor-pointer">
                                                <XIcon size={20} weight="bold" />
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-2 pl-3 border-l-2 border-primary/30">
                                            {change.filePaths.map(p => (
                                                <div key={p} className="text-sm text-body/90 font-medium truncate">{p.split(/[\\/]/).pop()}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <h3 className="text-muted font-bold tracking-wide uppercase text-sm mt-2">
                            Current Library
                        </h3>

                        {groups.map(group => (
                            <GroupItem
                                key={group.compId || group.tmdbId}
                                group={group}
                                selectedFiles={selectedFiles}
                                toggleFileSelection={toggleFileSelection}
                                toggleGroupSelection={toggleGroupSelection}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-full md:w-96 lg:w-100 flex flex-col bg-black/10 shrink-0 h-1/2 md:h-full">
                    <div className="p-4 border-b border-white/10 flex flex-col gap-3 shrink-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-body">Search Match</h2>
                            <span className="text-xs font-semibold bg-white/10 px-2 py-1 rounded text-muted">
                                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                            </span>
                        </div>

                        <div className="relative flex items-center">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search TMDB..."
                                disabled={selectedFiles.length === 0}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-9 py-2 text-sm text-body placeholder:text-muted focus:outline-none focus:border-primary disabled:opacity-50"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-body p-0.5 cursor-pointer"
                                >
                                    <XIcon size={16} weight="bold" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {selectedFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted gap-2 opacity-50 py-8">
                                <FolderIcon size={48} weight="duotone" />
                                <p>Select files from the left to rematch them.</p>
                            </div>
                        ) : isSearching ? (
                            <div className="animate-pulse flex flex-col gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3 items-center">
                                        <div className="w-12 h-16 bg-white/5 rounded"></div>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="h-4 bg-white/5 rounded w-3/4"></div>
                                            <div className="h-3 bg-white/5 rounded w-1/4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map(result => {
                                const title = result.title || result.name;
                                const year = (result.release_date || result.first_air_date || '').split('-')[0];
                                const poster = result.poster_path ? getFullImagePath(TMDB_IMAGE_BASE_URL, ImageSizes.W92, result.poster_path) : null;

                                return (
                                    <div
                                        key={`${result.media_type}-${result.id}`}
                                        className="flex gap-3 items-center p-2 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer"
                                        onClick={() => stageSelection(result)}
                                    >
                                        {poster ? (
                                            <img src={poster} alt={title} className="w-12 h-16 object-cover rounded bg-white/5 shrink-0" />
                                        ) : (
                                            <div className="w-12 h-16 bg-white/5 rounded flex items-center justify-center text-muted text-xs text-center border border-white/10 shrink-0">No<br />Img</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-body text-sm truncate">{title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-muted mt-1">
                                                <span className="capitalize">{result.media_type}</span>
                                                {year && <span>• {year}</span>}
                                            </div>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 bg-primary text-background p-2 rounded-full transition-opacity cursor-pointer">
                                            <CheckCircleIcon size={16} weight="bold" />
                                        </button>
                                    </div>
                                );
                            })
                        ) : searchQuery ? (
                            <div className="text-center text-muted mt-10">No results found on TMDB.</div>
                        ) : (
                            <div className="text-center text-muted mt-10 opacity-70">Type to search for a new match.</div>
                        )}
                    </div>

                    {/* Save Bar */}
                    <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
                        <button
                            onClick={saveChanges}
                            disabled={stagedChanges.length === 0 || isSaving}
                            className="w-full bg-primary text-background font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isSaving ? "Saving..." : `Save ${stagedChanges.length} Changes`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const GroupItem = ({ group, selectedFiles, toggleFileSelection, toggleGroupSelection }) => {
    const [expanded, setExpanded] = useState(false);

    const isUnmatched = String(group.tmdbId || group.compId || '').startsWith('local_');
    const allGroupFilesSelected = group.filePaths.length > 0 && group.filePaths.every(p => selectedFiles.includes(p));
    const someGroupFilesSelected = group.filePaths.some(p => selectedFiles.includes(p));

    return (
        <div className="flex flex-col border border-white/10 rounded-xl overflow-hidden bg-white/5 shrink-0 shadow-sm">
            <div className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                        className="shrink-0 text-muted hover:text-primary transition-colors cursor-pointer"
                        onClick={() => toggleGroupSelection(group.filePaths)}
                    >
                        {allGroupFilesSelected ? (
                            <CheckSquareIcon size={24} weight="fill" className="text-primary" />
                        ) : someGroupFilesSelected ? (
                            <MinusSquareIcon size={24} weight="fill" className="text-primary opacity-80" />
                        ) : (
                            <SquareIcon size={24} weight="regular" />
                        )}
                    </button>

                    <button onClick={() => setExpanded(!expanded)} className="flex-1 flex items-center gap-3 text-left min-w-0 cursor-pointer">
                        {isUnmatched && <span className="bg-danger-500/20 text-danger-500 border border-danger-500/30 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">Unmatched</span>}
                        <h4 className="font-bold text-body text-[15px] truncate">{group.title}</h4>
                        <span className="text-muted text-xs font-semibold bg-black/20 px-2 py-1 rounded shrink-0">{group.filePaths.length} file{group.filePaths.length > 1 ? 's' : ''}</span>
                    </button>
                </div>

                <button onClick={() => setExpanded(!expanded)} className="p-1 text-muted hover:text-body cursor-pointer">
                    <CaretDownIcon size={20} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden flex flex-col bg-black/20"
                    >
                        {group.filePaths.map((path, index) => {
                            const isSelected = selectedFiles.includes(path);
                            return (
                                <div
                                    key={path}
                                    onClick={() => toggleFileSelection(path)}
                                    className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors border-t border-white/5 ${isSelected ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                                >
                                    <div className="shrink-0 text-muted">
                                        {isSelected ? (
                                            <CheckSquareIcon size={20} weight="fill" className="text-primary" />
                                        ) : (
                                            <SquareIcon size={20} weight="regular" />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-sm truncate ${isSelected ? 'text-primary font-bold' : 'text-body font-medium'}`}>
                                            {path.split(/[\\/]/).pop()}
                                        </span>
                                        <span className={`text-xs truncate ${isSelected ? 'text-primary/70' : 'text-muted'}`}>
                                            {path}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

