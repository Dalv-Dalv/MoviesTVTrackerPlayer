import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useMediaData } from '../../shared/hooks/useMediaData';
import { useDelayedLoading } from '../../shared/hooks/useDelayedLoading';
import { DesktopMediaBackdrop, DesktopMediaBackdropSkeleton } from './MediaDetails/DesktopMediaBackdrop';
import { DesktopMediaPoster, DesktopMediaPosterSkeleton } from './MediaDetails/DesktopMediaPoster';
import { DesktopMediaHeroInfo, DesktopMediaHeroInfoSkeleton } from './MediaDetails/DesktopMediaHeroInfo';
import { DesktopMediaCast, DesktopMediaCastSkeleton } from './MediaDetails/DesktopMediaCast';
import { DesktopMediaTrailer, DesktopMediaTrailerSkeleton } from './MediaDetails/DesktopMediaTrailer';
import { DesktopMediaEpisodes } from './MediaDetails/DesktopMediaEpisodes';
import { FixMatchModal } from '../../shared/components/FixMatchModal';
import { RemoveMediaModal } from '../../shared/components/RemoveMediaModal';
import { FileInfoModal } from '../../shared/components/FileInfoModal';
import { ChangePostersPanel } from '../../shared/components/ChangePostersPanel';
import { Modal } from '../../shared/components/Modal';
import { getImageUrl } from '../../shared/services/TMDBMetadata';

export function DesktopMediaDetails({ compId }) {
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
    const [trailerPlaying, setTrailerPlaying] = useState(false);

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

    const displayPoster = posterOverrides && posterOverrides.poster !== media?.rawPosterUrl && changingPosterType
        ? getImageUrl(posterOverrides.poster, "w342")
        : media?.posterPath;

    const displayBackdrop = posterOverrides && posterOverrides.backdrop !== media?.rawBackdropUrl && changingPosterType
        ? getImageUrl(posterOverrides.backdrop, 'original')
        : (media?.backdropPathFull || media?.backdropPath);

    const displayLogo = posterOverrides && posterOverrides.logo !== media?.rawLogoUrl && changingPosterType
        ? getImageUrl(posterOverrides.logo)
        : media?.logoPath;

    const containerRef = useRef(null);
    const scrollY = useMotionValue(0);

    useEffect(() => {
        const scrollContainer = containerRef.current?.closest('.overflow-y-auto');
        if (!scrollContainer) return;

        const handleScroll = () => {
            scrollY.set(scrollContainer.scrollTop);
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [scrollY, compId, isLoading]);

    const backdropY = useTransform(scrollY, value => value * 0.3);

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
        <div ref={containerRef} className="w-full pb-400">
            {/* Poster Change Slide-over */}
            {media && (
                <ChangePostersPanel
                    media={media}
                    changingPosterType={changingPosterType}
                    setChangingPosterType={setChangingPosterType}
                    newPosterUrls={newPosterUrls}
                    setNewPosterUrls={handleSetNewPosterUrls}
                />
            )}

            {/* Backdrop parallax & top navigation buttons */}
            {showMediaSkeleton ? (
                <DesktopMediaBackdropSkeleton navigate={navigate} />
            ) : media ? (
                <DesktopMediaBackdrop
                    displayBackdrop={displayBackdrop}
                    backdropY={backdropY}
                    changingPosterType={changingPosterType}
                    navigate={navigate}
                    media={media}
                    onOpenModal={setActiveModal}
                    setChangingPosterType={setChangingPosterType}
                />
            ) : null}

            {/* Main Layout Grid */}
            <div className='w-full relative grid grid-cols-[min(33vw,20rem)_minmax(0,1fr)] gap-12'>
                {/* Column 1: Sticky Poster Column */}
                {showMediaSkeleton ? (
                    <DesktopMediaPosterSkeleton />
                ) : media ? (
                    <DesktopMediaPoster
                        media={media}
                        displayPoster={displayPoster}
                        changingPosterType={changingPosterType}
                    />
                ) : null}

                {/* Column 2: Right Details Column */}
                <div className='w-full h-full min-w-0'>
                    {showMediaSkeleton ? (
                        <DesktopMediaHeroInfoSkeleton />
                    ) : media ? (
                        <DesktopMediaHeroInfo
                            media={media}
                            compId={compId}
                            navigate={navigate}
                            changingPosterType={changingPosterType}
                            displayLogo={displayLogo}
                            movieGenres={movieGenres}
                            tvGenres={tvGenres}
                            historyLoaded={historyLoaded}
                            history={history}
                        />
                    ) : null}

                    {/* Subsections: Cast, Trailers, Episodes */}
                    {showMediaSkeleton ? (
                        <div className="flex flex-col gap-12">
                            <DesktopMediaCastSkeleton />
                            <DesktopMediaTrailerSkeleton />
                        </div>
                    ) : media ? (
                        <div className={`flex flex-col gap-12 transition-all duration-300 ${changingPosterType ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
                            <DesktopMediaCast media={media} compId={compId} navigate={navigate} />
                            <DesktopMediaTrailer media={media} trailerPlaying={trailerPlaying} setTrailerPlaying={setTrailerPlaying} />

                            {media.type === 'show' && (
                                <DesktopMediaEpisodes
                                    media={media}
                                    compId={compId}
                                    selectedSeasonNumber={selectedSeasonNumber ?? targetSeasonNumber}
                                    onSelectSeason={setSelectedSeasonNumber}
                                    navigate={navigate}
                                    isSeasonLoading={isSeasonLoading}
                                    showSeasonSkeleton={showSeasonSkeleton}
                                />
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

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
        </div>
    );
}
