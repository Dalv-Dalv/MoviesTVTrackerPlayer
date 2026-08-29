import React, { useEffect } from 'react';
import { type } from '@tauri-apps/plugin-os';

import MobileApp from './mobile/MobileApp';
import DesktopApp from './desktop/DesktopApp';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from './shared/components/PageWrapper';
import { MediaDetails } from './shared/components/MediaDetails';
import { Player as DesktopPlayer } from './desktop/components/Player';
import { Player as MobilePlayer } from './mobile/components/Player';
import { WindowTitlebar } from './desktop/components/WindowTitlebar';
import { useFullscreen } from './shared/hooks/useFullscreen';
import { isMobile } from './shared/utils/PlatformUtils';
import SettingsPage from './shared/components/SettingsPage';
import MoviesPage from './shared/components/MoviesPage';
import ShowsPage from './shared/components/ShowsPage';
import SearchPage from './shared/components/SearchPage';
import MobileNavbar from './mobile/components/MobileNavbar';
import HomePage from './shared/components/HomePage';
import FolderSettingsPage from './shared/components/FolderSettingsPage';
import DesktopNavbar from './desktop/components/DesktopNavbar';
import DesktopSettingsModal from './desktop/components/DesktopSettingsModal';

function App() {
    const osType = type();
    const { toggleFullscreen } = useFullscreen();

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
    }, [toggleFullscreen]);

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

const HIDDEN_NAVBAR_ROUTES = ['/play', '/details', '/settings'];
function AnimatedRoutes() {
    const location = useLocation();
    const isPlayer = location.pathname.startsWith('/play/');

    const showNavbar = !HIDDEN_NAVBAR_ROUTES.some(path => location.pathname.startsWith(path));;

    return (
        <>
            <div className={`absolute -z-50 inset-0 pointer-events-none transition-colors duration-500 ease-in-out ${isPlayer ? 'bg-transparent' : 'bg-background'}`} />

            <AnimatePresence>
                <Routes location={location} key={location.pathname}>
                    <Route path='/' element={
                        <PageWrapper edgeToEdge={true}>
                            <HomePage />
                        </PageWrapper>
                    } />

                    <Route path='/details/:tmdbId' element={
                        <PageWrapper>
                            <MediaDetails />
                        </PageWrapper>
                    } />

                    <Route path='/settings' element={
                        <PageWrapper useDefaultTransition={false} saveScroll={false}>
                            <SettingsPage />
                        </PageWrapper>
                    } />

                    <Route path='/settings/folders' element={
                        <PageWrapper useDefaultTransition={false} saveScroll={false}>
                            <FolderSettingsPage />
                        </PageWrapper>
                    } />

                    <Route path='/movies' element={
                        <PageWrapper>
                            <MoviesPage />
                        </PageWrapper>
                    } />

                    <Route path='/shows' element={
                        <PageWrapper>
                            <ShowsPage />
                        </PageWrapper>
                    } />

                    <Route path='/search' element={
                        <PageWrapper>
                            <SearchPage />
                        </PageWrapper>
                    } />

                    <Route path='/play/:tmdbId' element={
                        <PageWrapper transparent edgeToEdge={true} saveScroll={false}>
                            {isMobile ? <MobilePlayer /> : <DesktopPlayer />}
                        </PageWrapper>
                    } />
                </Routes>
            </AnimatePresence>

            <AnimatePresence>
                {showNavbar && (isMobile ? <MobileNavbar /> : <DesktopNavbar/>)}
            </AnimatePresence>

            {!isMobile && <DesktopSettingsModal />}
        </>
    );
}

export default App;