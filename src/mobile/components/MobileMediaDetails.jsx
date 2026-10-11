import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useMediaData } from '../../shared/hooks/useMediaData';
import { useDelayedLoading } from '../../shared/hooks/useDelayedLoading';
import { MobileMediaHero, MobileMediaHeroSkeleton } from './MediaDetails/MobileMediaHero';
import { MobileMediaCast, MobileMediaCastSkeleton } from './MediaDetails/MobileMediaCast';
import { MobileMediaEpisodes, MobileMediaEpisodesSkeleton } from './MediaDetails/MobileMediaEpisodes';
import { FixMatchModal } from '../../shared/components/FixMatchModal';
import { RemoveMediaModal } from '../../shared/components/RemoveMediaModal';
import { FileInfoModal } from '../../shared/components/FileInfoModal';
import { ChangePostersPanel } from '../../shared/components/ChangePostersPanel';
import { Modal } from '../../shared/components/Modal';

const TAB_STORAGE_KEY = 'desktopMediaDetailsTabs';
const MAX_STORED_TABS = 50;

function getSavedTab(compId, mediaType) {
    try {
        const stored = JSON.parse(localStorage.getItem(TAB_STORAGE_KEY) || '{}');
        const saved = stored[compId]?.tab;
        if (saved === 'episodes' && mediaType !== 'show') return 'details';
        return saved || 'details';
    } catch {
        return 'details';
    }
}

function saveTab(compId, tab) {
    try {
        const stored = JSON.parse(localStorage.getItem(TAB_STORAGE_KEY) || '{}');
        stored[compId] = { tab, ts: Date.now() };

        const keys = Object.keys(stored);
        if (keys.length > MAX_STORED_TABS) {
            keys.sort((a, b) => stored[b].ts - stored[a].ts);
            const pruned = {};
            for (let i = 0; i < MAX_STORED_TABS; i++) {
                pruned[keys[i]] = stored[keys[i]];
            }
            localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(pruned));
        } else {
            localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(stored));
        }
    } catch (e) {
        console.error("Failed to save tab", e);
    }
}

export function MobileMediaDetails({ compId }) {
    const navigate = useNavigate();
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(null);

    const {
        media,
        isLoading,
        isSeasonLoading,
        isError,
        history,
        historyLoaded,
        setProgressAndSave,
        movieGenres,
        tvGenres,
        targetSeasonNumber
    } = useMediaData(compId, selectedSeasonNumber);

    const showMediaSkeleton = useDelayedLoading(isLoading);
    const showSeasonSkeleton = useDelayedLoading(isSeasonLoading);

    const [activeModal, setActiveModal] = useState(null);
    const [changingPosterType, setChangingPosterType] = useState(null);
    const [posterOverrides, setPosterOverrides] = useState(null);

    const [activeTab, setActiveTab] = useState(() => getSavedTab(compId, media?.type));
    const prevTmdbId = useRef(compId);

    if (compId !== prevTmdbId.current) {
        prevTmdbId.current = compId;
        setActiveTab(getSavedTab(compId, media?.type));
    }

    useEffect(() => {
        if (activeTab === 'episodes' && media?.type !== 'show') {
            setActiveTab('details');
        } else {
            saveTab(compId, activeTab);
        }
    }, [activeTab, media?.type, compId]);

    const newPosterUrls = posterOverrides || {
        poster: media?.rawPosterUrl,
        backdrop: media?.rawBackdropUrl,
        logo: media?.rawLogoUrl
    };

    const handleSetNewPosterUrls = (updater) => {
        setPosterOverrides(prev => {
            const current = prev || {
                poster: media?.rawPosterUrl,
                backdrop: media?.rawBackdropUrl,
                logo: media?.rawLogoUrl
            };
            return typeof updater === 'function' ? updater(current) : updater;
        });
    };

    const containerRef = useRef(null);
    useEffect(() => {
        const scrollContainer = containerRef.current?.closest('.overflow-y-auto');
        if (!scrollContainer) return;

        if (changingPosterType) {
            scrollContainer.style.overflow = 'hidden';
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            scrollContainer.style.overflow = '';
        }

        return () => {
            scrollContainer.style.overflow = '';
        };
    }, [changingPosterType]);

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full text-white bg-background">
                <h2 className="text-2xl font-bold mb-4">Media not found!</h2>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-semibold">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full flex flex-col gap-6 pb-12 relative z-10 bg-background">
            {showMediaSkeleton ? (
                <>
                    <MobileMediaHeroSkeleton navigate={navigate} activeTab={activeTab} />
                    {activeTab === 'episodes' && (
                        <div className="flex flex-col px-4 ml:px-6">
                            <div className="w-36 h-9 rounded-xl bg-white/10 animate-pulse mb-3" />
                            <MobileMediaEpisodesSkeleton />
                        </div>
                    )}
                    {activeTab === 'cast' && (
                        <MobileMediaCastSkeleton />
                    )}
                </>
            ) : media ? (
                <MobileMediaHero
                    media={media}
                    compId={compId}
                    navigate={navigate}
                    changingPosterType={changingPosterType}
                    setChangingPosterType={setChangingPosterType}
                    posterOverrides={posterOverrides}
                    onOpenModal={setActiveModal}
                    movieGenres={movieGenres}
                    tvGenres={tvGenres}
                    historyLoaded={historyLoaded}
                    history={history}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            ) : null}

            {/* Tab Views */}
            {!showMediaSkeleton && media && (
                <>
                    {activeTab === 'episodes' && media.type === 'show' && (
                        <MobileMediaEpisodes
                            media={media}
                            compId={compId}
                            selectedSeasonNumber={selectedSeasonNumber ?? targetSeasonNumber}
                            onSelectSeason={setSelectedSeasonNumber}
                            navigate={navigate}
                            isSeasonLoading={isSeasonLoading}
                            showSeasonSkeleton={showSeasonSkeleton}
                        />
                    )}

                    {activeTab === 'cast' && (
                        <MobileMediaCast media={media} navigate={navigate} />
                    )}
                </>
            )}

            {/* Modals */}
            <FixMatchModal
                isOpen={activeModal === 'FIX_MATCH'}
                onClose={() => setActiveModal(null)}
                media={media}
                compId={compId}
                navigate={navigate}
            />

            <Modal isOpen={activeModal === 'CONFIRM_RESET'} onClose={() => setActiveModal(null)} title="Reset Watch Time">
                <p className="mb-6">Are you sure you want to reset your watch time? This cannot be undone.</p>
                <div className="flex gap-4 justify-end">
                    <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-lg hover:bg-divider transition-colors cursor-pointer">Cancel</button>
                    <button onClick={() => { setActiveModal(null); setProgressAndSave(0); }} className="px-4 py-2 bg-danger-600 text-white rounded-lg font-semibold hover:bg-danger-500 transition-colors cursor-pointer">Reset</button>
                </div>
            </Modal>

            <RemoveMediaModal
                isOpen={activeModal === 'CONFIRM_REMOVE'}
                onClose={() => setActiveModal(null)}
                compId={compId}
                navigate={navigate}
            />

            <FileInfoModal
                isOpen={activeModal === 'FILE_INFO'}
                onClose={() => setActiveModal(null)}
                media={media}
            />

            <ChangePostersPanel
                media={media}
                changingPosterType={changingPosterType}
                setChangingPosterType={setChangingPosterType}
                newPosterUrls={newPosterUrls}
                setNewPosterUrls={handleSetNewPosterUrls}
            />
        </div>
    );
}
