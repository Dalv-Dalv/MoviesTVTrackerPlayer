import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSearch, getSearchItemPath } from "../../shared/hooks/useSearch";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { MediaImage } from "../../shared/components/MediaImage";
import { SearchPosterCard } from "../../shared/components/SearchPosterCard";
import { motion, useMotionValue, useTransform } from "framer-motion";

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'movies', label: 'Movies' },
    { id: 'shows', label: 'TV Shows' },
    { id: 'people', label: 'People' },
    { id: 'collections', label: 'Collections' }
];

export function DesktopSearchPage({ className = '' }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const query = searchParams.get('q') || '';
    const trimmedQuery = query.trim();
    const activeFilter = searchParams.get('filter') || 'all';

    const {
        results,
        isSearching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useSearch(trimmedQuery, activeFilter, 0);

    const containerRef = useRef(null);
    const loadMoreRef = useRef(null);
    const scrollY = useMotionValue(0);

    useEffect(() => {
        const scrollContainer = containerRef.current?.closest('.overflow-y-auto');

        const handleScroll = (e) => {
            const currentTop = e?.detail?.scrollTop ?? scrollContainer?.scrollTop ?? window.scrollY ?? 0;
            scrollY.set(currentTop);
        };

        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
            handleScroll();
        }

        window.addEventListener('page-scroll', handleScroll, { passive: true });
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            scrollContainer?.removeEventListener('scroll', handleScroll);
            window.removeEventListener('page-scroll', handleScroll);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [scrollY]);

    useEffect(() => {
        const sentinel = loadMoreRef.current;
        if (!sentinel || !hasNextPage || isFetchingNextPage) return;

        const scrollRoot = containerRef.current?.closest('.overflow-y-auto') || null;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            {
                root: scrollRoot,
                rootMargin: '400px'
            }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, results.length]);

    const backdropY = useTransform(scrollY, value => value * -0.3);

    const backdropItem = results.find(r => r.backdrop_path) || results[0];
    const backdropPath = backdropItem?.backdrop_path || backdropItem?.poster_path || backdropItem?.profile_path;

    const handleFilterChange = (filterId) => {
        if (filterId === activeFilter) return;
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (filterId === 'all') {
                next.delete('filter');
            } else {
                next.set('filter', filterId);
            }
            return next;
        }, { replace: true });
    };

    return (
        <div ref={containerRef} className={`w-full min-h-screen text-body flex flex-col pt-24 pb-20 px-8 lg:px-14 ${className}`}>
            {/* Filter Pills */}
            <div className="flex mb-6 items-center gap-2 overflow-x-auto">
                {FILTERS.map(f => {
                    const isSelected = activeFilter === f.id;
                    return (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => handleFilterChange(f.id)}
                            className={`text-xs px-4 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${isSelected
                                ? 'bg-white/15 border-white/30 text-white shadow-sm'
                                : 'bg-white/5 border-white/5 text-muted hover:text-body hover:bg-white/10'
                                }`}
                        >
                            {f.label}
                        </button>
                    );
                })}
            </div>

            {backdropPath && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none noselect -z-10 bg-background">
                    <motion.div style={{ y: backdropY }} className="relative w-full">
                        <MediaImage
                            imagePath={backdropPath}
                            className="w-full h-auto min-w-screen min-h-screen pointer-events-none blur-3xl opacity-60"
                        />
                    </motion.div>
                </div>
            )}

            {/* Results Grid / States */}
            <div className="flex-1">
                {!trimmedQuery ? (
                    <div className="flex flex-col items-center justify-center text-center text-muted gap-3 py-28">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <MagnifyingGlassIcon size={30} className="opacity-40" />
                        </div>
                        <h2 className="text-lg font-medium text-white">Search Movies, TV Shows & People</h2>
                        <p className="text-sm text-muted/60 max-w-sm">
                            Use the search bar above to discover titles, cast members, and collections.
                        </p>
                    </div>
                ) : isSearching ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {Array.from({ length: 12 }, (_, i) => (
                            <div
                                key={`skel_${i}`}
                                className="aspect-2/3 w-full rounded-lg bg-surface/40 border border-white/5 animate-pulse"
                            />
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {results.map((item) => (
                                <SearchPosterCard
                                    key={`${item.media_type}_${item.id}`}
                                    item={item}
                                    variant="desktop"
                                    onClick={() => navigate(getSearchItemPath(item))}
                                />
                            ))}

                            {isFetchingNextPage &&
                                Array.from({ length: 6 }, (_, i) => (
                                    <div
                                        key={`next_skel_${i}`}
                                        className="aspect-2/3 w-full rounded-lg bg-surface/30 border border-white/5 animate-pulse"
                                    />
                                ))}
                        </div>

                        {hasNextPage && <div ref={loadMoreRef} className="h-10 w-full" />}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted gap-3 py-28">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <MagnifyingGlassIcon size={30} className="opacity-40" />
                        </div>
                        <h2 className="text-lg font-medium text-white">No results found for "{trimmedQuery}"</h2>
                        <p className="text-sm text-muted/60 max-w-sm">
                            Try checking the spelling, using fewer keywords, or switching filter categories.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DesktopSearchPage;