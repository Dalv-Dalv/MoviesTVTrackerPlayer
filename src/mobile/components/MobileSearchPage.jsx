import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Carousel } from "../../shared/components/Carousel";
import { SearchPosterCard } from "../../shared/components/SearchPosterCard";
import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useTargetedSearch, useTopHitCategory, getSearchItemPath } from "../../shared/hooks/useSearch";
import { useDebounce } from "../../shared/hooks/useDebounce";

const SECTION_MAP = {
    movies: { key: 'movies', title: 'Movies' },
    shows: { key: 'shows', title: 'TV Shows' },
    people: { key: 'people', title: 'People' },
    collections: { key: 'collections', title: 'Collections' }
};

const BASE_ORDER = ['movies', 'shows', 'people', 'collections'];

let persistentMobileQuery = '';

function TargetedSearchCarousel({
    sectionKey,
    title,
    query,
    onCardClick,
    onStatusChange
}) {
    const {
        items,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useTargetedSearch(query, sectionKey);

    useEffect(() => {
        onStatusChange?.(sectionKey, items.length, isLoading);
    }, [sectionKey, items.length, isLoading, onStatusChange]);

    const handleReachEnd = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (!isLoading && items.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold text-body px-3 tracking-wide">
                {title}
            </h3>

            {isLoading && items.length === 0 ? (
                <div className="flex gap-4 overflow-x-auto noScrollbar px-3">
                    {Array.from({ length: 4 }, (_, i) => (
                        <div
                            key={`skel_${sectionKey}_${i}`}
                            className="w-28 shrink-0 aspect-2/3 rounded-lg bg-surface/40 border border-white/5 animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <Carousel
                    key={`${sectionKey}-${query}`}
                    id={`mobile-search-${sectionKey}`}
                    saveScroll={false}
                    paddingClass="px-3 scroll-px-3 pb-1"
                    className="relative z-0"
                    onReachEnd={handleReachEnd}
                >
                    {items.map((item) => (
                        <SearchPosterCard
                            key={`${sectionKey}_${item.media_type}_${item.id}`}
                            item={item}
                            variant="mobile"
                            onClick={() => onCardClick(item)}
                        />
                    ))}

                    {isFetchingNextPage && (
                        <>
                            <div className="w-28 shrink-0 aspect-2/3 rounded-lg bg-surface/30 border border-white/5 animate-pulse" />
                            <div className="w-28 shrink-0 aspect-2/3 rounded-lg bg-surface/30 border border-white/5 animate-pulse" />
                        </>
                    )}
                </Carousel>
            )}
        </div>
    );
}

export function MobileSearchPage({ className = '' }) {
    const navigate = useNavigate();
    const inputRef = useRef(null);

    const [query, setQueryState] = useState(persistentMobileQuery);

    const setQuery = useCallback((val) => {
        persistentMobileQuery = val;
        setQueryState(val);
    }, []);

    const debouncedQuery = useDebounce(query, 300);
    const trimmedQuery = debouncedQuery.trim();

    const { topHitCategory } = useTopHitCategory(trimmedQuery);

    const orderedSections = useMemo(() => {
        if (topHitCategory && BASE_ORDER.includes(topHitCategory)) {
            return [
                SECTION_MAP[topHitCategory],
                ...BASE_ORDER.filter((k) => k !== topHitCategory).map((k) => SECTION_MAP[k])
            ];
        }
        return BASE_ORDER.map((k) => SECTION_MAP[k]);
    }, [topHitCategory]);

    const [sectionStatus, setSectionStatus] = useState({});

    // Bail out if values haven't changed to avoid cascading re-renders
    const handleStatusChange = useCallback((key, count, isLoading) => {
        setSectionStatus((prev) => {
            const existing = prev[key];
            if (existing && existing.count === count && existing.isLoading === isLoading) {
                return prev;
            }
            return {
                ...prev,
                [key]: { count, isLoading }
            };
        });
    }, []);

    useEffect(() => {
        setSectionStatus({});
    }, [trimmedQuery]);

    const allChecked = Boolean(trimmedQuery) && BASE_ORDER.every(
        (k) => sectionStatus[k] && !sectionStatus[k].isLoading
    );
    const totalFound = Object.values(sectionStatus).reduce(
        (sum, s) => sum + (s?.count || 0),
        0
    );
    const hasNoResults = allChecked && totalFound === 0;

    const focusInput = useCallback(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        try {
            const len = el.value?.length || 0;
            el.setSelectionRange(len, len);
        } catch {
            // Ignore selection range errors on unsupported input types
        }
    }, []);

    const handleClear = useCallback(() => {
        setQuery('');
        focusInput();
        const scrollContainer = inputRef.current?.closest('.overflow-y-auto');
        scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [focusInput, setQuery]);

    useEffect(() => {
        if (!persistentMobileQuery) {
            const frame = requestAnimationFrame(focusInput);
            return () => cancelAnimationFrame(frame);
        }
    }, [focusInput]);

    useEffect(() => {
        window.addEventListener('mobile-search-focus', focusInput);
        window.addEventListener('mobile-search-clear', handleClear);

        return () => {
            window.removeEventListener('mobile-search-focus', focusInput);
            window.removeEventListener('mobile-search-clear', handleClear);
        };
    }, [focusInput, handleClear]);

    const handleCardClick = useCallback((item) => {
        inputRef.current?.blur();
        navigate(getSearchItemPath(item));
    }, [navigate]);

    return (
        <div className={`w-full min-h-screen text-body flex flex-col ${className}`}>
            {/* Top Dedicated Search Bar Header for Mobile */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 0, opacity: 0 }}
                transition={{ type: "tween", ease: [0.25, 1, 0.5, 1], duration: 0.4 }}
                className="sticky top-0 inset-x-0 z-30 pt-[calc(var(--safe-top,0px))] pointer-events-none bg-linear-to-b from-background to-transparent"
            >
                {/* Search Input Bar */}
                <div className="relative h-12 m-2 mx-4 rounded-full overflow-hidden flex items-center pl-3.5 gap-2.5 shadow-xl pointer-events-auto group">
                    <div className="absolute -inset-8 bg-surface/70 group-focus-within:bg-surface/90 transition-colors duration-300 backdrop-blur-lg -z-10" />

                    <MagnifyingGlassIcon size={22} className="text-muted/70 group-focus-within:text-muted transition-colors duration-300 shrink-0" />

                    <input
                        ref={inputRef}
                        type="text"
                        inputMode="text"
                        enterKeyHint="search"
                        autoFocus={!persistentMobileQuery}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search movies, TV shows, people..."
                        className="flex-1 bg-transparent text-body placeholder:text-muted/50 text-[15px] outline-none min-w-0"
                        autoComplete="on"
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        spellCheck={true}
                    />

                    {query.length > 0 && (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleClear}
                            className="h-full px-3.5 rounded-l-full bg-white/0 active:bg-white/10 flex items-center justify-center text-muted/70 group-focus-within:text-muted active:text-body transition-colors duration-300 cursor-pointer shrink-0"
                            aria-label="Clear search"
                        >
                            <XIcon size={22} />
                        </button>
                    )}

                    <div className="absolute inset-0 z-10 rounded-full ring ring-inset ring-white/5 shadow-[inset_0_3px_5px_rgba(255,255,255,0.1)] pointer-events-none" />
                </div>
            </motion.div>

            {/* Results Section */}
            <div className="flex-1 pt-2 pb-[calc(5.5rem+var(--safe-bottom,0px))] flex flex-col gap-8">
                {!query.trim() ? (
                    <div className="flex-1 px-4 flex flex-col items-center justify-center text-center text-muted gap-3 py-20">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                            <MagnifyingGlassIcon size={32} className="opacity-60" />
                        </div>
                        <h2 className="text-base font-medium text-body">Search Movies, TV Shows & People</h2>
                        <p className="text-xs text-muted/60 max-w-xs">
                            Discover titles and cast members across your library and online.
                        </p>
                    </div>
                ) : hasNoResults ? (
                    <div className="flex-1 px-4 flex flex-col items-center justify-center text-center text-muted gap-2 py-20">
                        <p className="text-base font-medium text-body">No results found for "{query.trim()}"</p>
                        <p className="text-xs text-muted/60 max-w-xs">
                            Try checking for spelling errors or searching for a different keyword.
                        </p>
                    </div>
                ) : (
                    orderedSections.map((section) => (
                        <TargetedSearchCarousel
                            key={section.key}
                            sectionKey={section.key}
                            title={section.title}
                            query={trimmedQuery}
                            onCardClick={handleCardClick}
                            onStatusChange={handleStatusChange}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default MobileSearchPage;