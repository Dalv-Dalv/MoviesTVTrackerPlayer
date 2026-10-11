import { CaretDownIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { useSearch } from "../../shared/hooks/useSearch";
import { AnimatePresence, motion } from "framer-motion";
import { MediaImage } from "../../shared/components/MediaImage";
import { ProfileImage } from "../../shared/components/ProfileImage";
import { useNavigate } from "react-router-dom";



function BaseSearchCard({ id, imageNode, label, title, subtitle, tags, isSelected, onClick }) {
    return (
        <div
            id={id}
            onClick={onClick}
            className={`shrink-0 cursor-pointer relative h-24 w-full p-1 rounded-lg flex gap-2 overflow-hidden transition-all ${isSelected ? 'bg-white/10 ring-1 ring-inset ring-white/20' : 'bg-black/20 hover:bg-white/5'}`}
        >
            {imageNode}

            <div className="flex-1 flex flex-col justify-center">
                <span className="text-sm text-muted">
                    {label}
                </span>

                <h2 className="text-body tracking-wide truncate max-w-full">
                    {title}
                </h2>

                {(subtitle || (tags && tags.length > 0)) && (
                    <div className="text-sm text-muted flex gap-2 items-center overflow-hidden">
                        {subtitle && <span className="shrink-0">{subtitle}</span>}

                        {tags && tags.length > 0 && (
                            <div className='flex items-center gap-1 noselect min-w-0 overflow-hidden'>
                                {tags.map((tag, index, arr) => {
                                    return (
                                        <div key={tag} className='flex items-center gap-1 tracking-wide min-w-0 shrink'>
                                            <span className="truncate">{tag}</span>
                                            {index < arr.length - 1 && <span className="shrink-0">•</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function MediaCard({ id, data: media, isSelected, onClick }) {
    const isMovie = media.media_type === 'movie';
    const imageNode = (
        <div className="h-full aspect-2/3 shrink-0">
            <MediaImage imagePath={media.poster_path} className="w-full h-full object-cover rounded-sm" />
        </div>
    );

    return (
        <BaseSearchCard
            id={id}
            imageNode={imageNode}
            label={isMovie ? 'Movie' : 'TV Show'}
            title={isMovie ? media.title : media.name}
            subtitle={media.release_year}
            tags={media.genres}
            isSelected={isSelected}
            onClick={onClick}
        />
    );
}

function PersonCard({ id, data: person, isSelected, onClick }) {
    const tagText = person.known_for_department === 'Acting' ? `Act${person.gender === 1 ? 'ress' : 'or'}` : person.known_for_department;

    const imageNode = (
        <div className="h-full aspect-2/3 shrink-0">
            <ProfileImage imagePath={person.profile_path} className="w-full h-full object-cover rounded-sm" iconSize={32} />
        </div>
    );

    const tags = (person.known_for || []).map(media => media.name || media.title);

    return (
        <BaseSearchCard
            id={id}
            imageNode={imageNode}
            label={tagText}
            title={person.name}
            subtitle="Known for"
            tags={tags}
            isSelected={isSelected}
            onClick={onClick}
        />
    );
}

function CollectionCard({ id, data: collection, isSelected, onClick }) {
    const imageNode = (
        <div className="h-full aspect-2/3 shrink-0">
            <MediaImage imagePath={collection.poster_path} className="w-full h-full object-cover rounded-sm" />
        </div>
    );

    return (
        <BaseSearchCard
            id={id}
            imageNode={imageNode}
            label="Collection"
            title={collection.name}
            tags={[]}
            isSelected={isSelected}
            onClick={onClick}
        />
    );
}

const TYPE_TO_CARD = {
    'movie': MediaCard,
    'tv': MediaCard,
    'person': PersonCard,
    'collection': CollectionCard
}

let persistentQuery = "";
let persistentFilter = "all";

export default function DesktopSearchBar() {
    const FILTERS = [
        { id: 'all', label: 'All' },
        { id: 'movies', label: 'Movies' },
        { id: 'shows', label: 'Shows' },
        { id: 'people', label: 'People' },
        { id: 'collections', label: 'Collections' }
    ];

    const [query, setQueryState] = useState(persistentQuery);
    const [isFocused, setIsFocused] = useState(false);
    const [activeFilter, setActiveFilterState] = useState(persistentFilter);

    const setQuery = (val) => {
        persistentQuery = val;
        setQueryState(val);
    };

    const setActiveFilter = (val) => {
        persistentFilter = val;
        setActiveFilterState(val);
    };
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [hasCompletedSearch, setHasCompletedSearch] = useState(false);

    const { results, isLoading, debouncedSearch } = useSearch(query, activeFilter, 300);

    useEffect(() => {
        if (debouncedSearch && !isLoading) {
            setHasCompletedSearch(true);
        }
    }, [debouncedSearch, isLoading]);

    useEffect(() => {
        if (!query.trim()) {
            setHasCompletedSearch(false);
        }
    }, [query]);

    const isTyping = query.trim() !== (debouncedSearch || '').trim();
    const showSkeletons = (isTyping && hasCompletedSearch) || (!isTyping && isLoading);
    const hasContent = showSkeletons || (results && results.length > 0) || Boolean(debouncedSearch && !isLoading);

    const scrollRef = useRef(null);
    const resultsContainerRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const maxScroll = scrollHeight - clientHeight;
        const distanceToBottom = maxScroll - scrollTop;

        let alpha = 1 - (distanceToBottom / 40);
        if (alpha < 0) alpha = 0;
        if (alpha > 1) alpha = 1;

        scrollRef.current.style.setProperty('--mask-alpha', alpha.toFixed(2));
    };

    useEffect(() => {
        if (isFocused && query && hasContent) {
            setTimeout(handleScroll, 50);
        }
    }, [results, isFocused, query, hasContent, showSkeletons]);

    useEffect(() => {
        setSelectedIndex(-1);
    }, [results, activeFilter]);

    useEffect(() => {
        if (selectedIndex >= 0) {
            const item = document.getElementById(`search_result_${selectedIndex}`);
            if (item) {
                item.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);


    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            inputRef.current?.blur();
            setIsFocused(false);
            return;
        }

        if (!query) return;

        if (e.key === 'Tab') {
            e.preventDefault();
            const currentIndex = FILTERS.findIndex(f => f.id === activeFilter);
            let next;
            if (e.shiftKey) {
                next = currentIndex - 1 < 0 ? FILTERS.length - 1 : currentIndex - 1;
            } else {
                next = (currentIndex + 1) % FILTERS.length;
            }
            if (FILTERS[next].id !== activeFilter) {
                setActiveFilter(FILTERS[next].id);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!showSkeletons && results && results.length > 0) {
                const maxIndex = Math.min(results.length, 10) - 1;
                setSelectedIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!showSkeletons && results && results.length > 0) {
                const maxIndex = Math.min(results.length, 10) - 1;
                setSelectedIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (!showSkeletons && selectedIndex >= 0 && results[selectedIndex]) {
                const item = results[selectedIndex];
                const mediaType = item.media_type === 'tv' ? 'show' : item.media_type;
                navigate(`/details/${mediaType}_${item.id}`);
                setIsFocused(false);
            } else if (query.trim()) {
                navigate(`/search?q=${encodeURIComponent(query.trim())}&filter=${activeFilter}`);
                setIsFocused(false);
            }
        }
    };

    return (
        <div className="relative flex-1 h-full">
            <motion.div className="absolute top-0 left-0 w-full overflow-hidden rounded-3xl ring-1 ring-inset ring-white/5 hover:ring-white/10 focus-within:ring-white/15 transition-colors duration-300 pointer-events-auto group shadow-lg">
                <div className={`absolute -inset-8 backdrop-blur-lg transition-colors duration-200 -z-10 ${query && isFocused
                    ? 'bg-surface/90'
                    : 'bg-surface/30 group-hover:bg-surface/50 group-focus-within:bg-surface/60'
                    }`} />

                <div className="flex items-center gap-2 p-2 h-12">
                    <MagnifyingGlassIcon size={28} className='ml-1 shrink-0 relative text-body/50 transition-colors duration-200 group-hover:text-body/80 group-focus-within:text-body/60' />

                    <div className='flex-1 h-full'>
                        <input
                            ref={inputRef}
                            className="w-full h-full bg-transparent text-body placeholder:text-muted outline-none not-focus:text-body/50 group-hover:text-body"
                            type="search"
                            placeholder="Search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onKeyDown={handleKeyDown}
                            onBlur={() => {
                                setTimeout(() => setIsFocused(false), 200);
                            }}
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {query && isFocused && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                            <div
                                className={`px-4 flex items-center gap-2 text-body/50 ${hasContent ? 'pb-3' : 'pb-4'}`}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <span className="text-muted shrink-0 mr-1">
                                    Search in
                                </span>

                                {FILTERS.map(filter => (
                                    <div
                                        key={filter.id}
                                        onClick={() => {
                                            if (activeFilter !== filter.id) {
                                                setActiveFilter(filter.id);
                                            }
                                        }}
                                        className={`p-1 px-3 rounded-lg transition-all noselect cursor-pointer border ${activeFilter === filter.id ? 'bg-white/10 border-white/20 text-white shadow-md' : 'border-white/5 hover:bg-white/5 hover:text-body/80'}`}
                                    >
                                        {filter.label}
                                    </div>
                                ))}
                            </div>

                            {hasContent && (
                                <div
                                    ref={scrollRef}
                                    onScroll={handleScroll}
                                    style={{
                                        WebkitMaskImage: 'linear-gradient(to bottom, black 90%, rgba(0,0,0, var(--mask-alpha, 0)) 99%)',
                                        maskImage: 'linear-gradient(to bottom, black 90%, rgba(0,0,0, var(--mask-alpha, 0)) 99%)'
                                    }}
                                    className="px-4 pb-4 text-body/50 max-h-[60vh] rounded-lg overflow-y-auto"
                                >
                                    <div
                                        ref={resultsContainerRef}
                                        className="flex flex-col gap-2 w-full rounded-lg relative"
                                        onMouseDown={(e) => e.preventDefault()}
                                    >
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={`search_results_${activeFilter}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.15 }}
                                                className="flex flex-col gap-2 w-full"
                                            >
                                                {showSkeletons ? (
                                                    Array(5).fill(0).map((_, i) => (
                                                        <div key={`skel_${i}`} className="shrink-0 relative h-24 w-full p-1 bg-black/20 rounded-lg flex gap-2 overflow-hidden">
                                                            <div className="h-full aspect-[2/3] shrink-0 bg-white/5 rounded-sm animate-pulse" />
                                                            <div className="flex-1 flex flex-col justify-center gap-2">
                                                                <div className="h-3 w-12 bg-white/5 rounded animate-pulse" />
                                                                <div className="h-5 w-48 bg-white/5 rounded animate-pulse" />
                                                                <div className="h-3 w-32 bg-white/5 rounded animate-pulse mt-1" />
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : results && results.length > 0 ? (
                                                    results.slice(0, 10).map((result, index) => {
                                                        const Card = TYPE_TO_CARD[result.media_type];
                                                        return Card ? (
                                                            <Card
                                                                key={`${result.media_type}_${result.id}`}
                                                                id={`search_result_${index}`}
                                                                data={result}
                                                                isSelected={index === selectedIndex}
                                                                onClick={() => {
                                                                    const mediaType = result.media_type === 'tv' ? 'show' : result.media_type;
                                                                    navigate(`/details/${mediaType}_${result.id}`);
                                                                    setIsFocused(false);
                                                                }}
                                                            />
                                                        ) : null;
                                                    })
                                                ) : debouncedSearch && !isLoading ? (
                                                    <div className="py-8 text-center text-muted text-sm">
                                                        No results found
                                                    </div>
                                                ) : null}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

