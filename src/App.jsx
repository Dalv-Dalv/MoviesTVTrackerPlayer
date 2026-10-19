import React, { useEffect, useState } from 'react';
import { type } from '@tauri-apps/plugin-os';

import MobileApp from './mobile/MobileApp';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from './shared/components/PageWrapper';
import { DetailsPage } from './shared/components/DetailsPage';
import { Player as DesktopPlayer } from './desktop/components/Player';
import { Player as MobilePlayer } from './mobile/components/Player';
import { WindowTitlebar } from './desktop/components/WindowTitlebar';
import { useFullscreen } from './shared/hooks/useFullscreen';
import { isMobile } from './shared/utils/PlatformUtils';
import SettingsPage from './mobile/components/SettingsPage';
import MoviesPage from './shared/components/MoviesPage';
import ShowsPage from './shared/components/ShowsPage';
import SearchPage from './shared/components/SearchPage';
import MobileNavbar from './mobile/components/MobileNavbar';
import HomePage from './shared/components/HomePage';
import FolderSettingsPage from './mobile/components/FolderSettingsPage';
import DesktopNavbar from './desktop/components/DesktopNavbar';
import DesktopSettingsModal from './desktop/components/DesktopSettingsModal';
import LibraryManagerPage from './desktop/components/LibraryManagerPage';

import { useLibraryStore } from './shared/store/useLibraryStore';
import { useSetting, useSettingsStore } from './shared/store/useSettingsStore';
import { useTMDB } from './shared/hooks/useTMDB';

function App() {
    const osType = type();
    const { toggleFullscreen } = useFullscreen();

    const [folders] = useSetting('videoLibraryFolders', []);
    const tmdb = useTMDB();
    const loadCacheOnBoot = useLibraryStore(state => state.loadCacheOnBoot);
    const rescan = useLibraryStore(state => state.rescan);
    const isLoaded = useLibraryStore(state => Object.keys(state.library).length > 0);
    const settingsLoaded = useSettingsStore(state => state.isLoaded);

    useEffect(() => {
        loadCacheOnBoot();
    }, [loadCacheOnBoot]);

    useEffect(() => {
        if (!tmdb) return;
        rescan();
    }, [folders, tmdb, rescan]);

    useEffect(() => {
        const initPlatform = () => {
            try {
                const isMobile = osType === 'android' || osType === 'ios';
                document.documentElement.dataset.platform = isMobile ? 'mobile' : 'desktop';
            } catch (error) {
                const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                document.documentElement.dataset.platform = isTouch ? 'mobile' : 'desktop';
            }
        };
        initPlatform();

        const handleKeyDown = (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleFullscreen, osType]);

    if (!settingsLoaded) return <div className="h-screen w-screen bg-background" />;

    return (
        <BrowserRouter>
            <div className="h-screen w-screen relative overflow-hidden">
                {!isMobile && (
                    <WindowTitlebar />
                )}

                <AnimatedRoutes />
            </div>
        </BrowserRouter>
    );
}

const HIDDEN_NAVBAR_ROUTES = ['/play', '/details', '/settings', '/library-manager'];
function AnimatedRoutes() {
    const location = useLocation();
    const isPlayerRoute = location.pathname.startsWith('/play/');
    const [isPlayerLoading, setIsPlayerLoading] = useState(true);

    useEffect(() => {
        if (!isPlayerRoute) {
            setIsPlayerLoading(true);
        }
    }, [isPlayerRoute]);

    useEffect(() => {
        const handler = (e) => setIsPlayerLoading(e.detail.isLoading);
        window.addEventListener('player-loading', handler);
        return () => window.removeEventListener('player-loading', handler);
    }, []);

    const showNavbar = !HIDDEN_NAVBAR_ROUTES.some(path => location.pathname.startsWith(path));

    const bgClass = isPlayerRoute
        ? (isPlayerLoading ? 'bg-black' : 'bg-transparent')
        : 'bg-background';

    return (
        <>
            <div className={`absolute -z-50 inset-0 pointer-events-none transition-colors duration-500 ease-in-out ${bgClass}`} />

            <AnimatePresence>
                <Routes location={location} key={location.pathname}>
                    <Route path='/' element={
                        <PageWrapper depth={0} edgeToEdge={['top']}>
                            <HomePage />
                        </PageWrapper>
                    } />

                    <Route path='/details/:compId' element={
                        <PageWrapper depth={1} edgeToEdge={['top']}>
                            <DetailsPage />
                        </PageWrapper>
                    } />

                    <Route path='/settings' element={
                        <PageWrapper depth={1} useDefaultTransition={false} saveScroll={false}>
                            <SettingsPage />
                        </PageWrapper>
                    } />

                    <Route path='/settings/folders' element={
                        <PageWrapper depth={2} useDefaultTransition={false} saveScroll={false}>
                            <FolderSettingsPage />
                        </PageWrapper>
                    } />

                    <Route path='/library-manager' element={
                        <PageWrapper depth={2} saveScroll={false}>
                            <LibraryManagerPage />
                        </PageWrapper>
                    } />

                    <Route path='/movies' element={
                        <PageWrapper depth={0}>
                            <MoviesPage />
                        </PageWrapper>
                    } />

                    <Route path='/shows' element={
                        <PageWrapper depth={0}>
                            <ShowsPage />
                        </PageWrapper>
                    } />

                    <Route path='/search' element={
                        <PageWrapper depth={0} edgeToEdge={['top']}>
                            <SearchPage />
                        </PageWrapper>
                    } />

                    <Route path='/play/:compId' element={
                        <PageWrapper depth={3} transparent edgeToEdge={true} saveScroll={false}>
                            {isMobile ? <MobilePlayer /> : <DesktopPlayer />}
                        </PageWrapper>
                    } />
                </Routes>
            </AnimatePresence>

            <AnimatePresence>
                {showNavbar && (isMobile ? <MobileNavbar key="mobile-nav" /> : <DesktopNavbar key="desktop-nav" />)}
            </AnimatePresence>

            {!isMobile && <DesktopSettingsModal />}
        </>
    );
}

export default App;
