import React, { useEffect } from 'react';
import { type } from '@tauri-apps/plugin-os';

import MobileApp from './mobile/MobileApp';
import DesktopApp from './desktop/DesktopApp';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from './shared/components/PageWrapper';
import { MediaDetails } from './shared/components/MediaDetails';
import { Player } from './desktop/components/Player';
import { WindowTitlebar } from './desktop/components/WindowTitlebar';
import { useFullscreen } from './shared/hooks/useFullscreen';
import { isMobile } from './shared/utils/PlatformUtils';
import SettingsPage from './shared/components/SettingsPage';
import MoviesPage from './shared/components/MoviesPage';
import ShowsPage from './shared/components/ShowsPage';
import SearchPage from './shared/components/SearchPage';
import MobileNavbar from './mobile/components/MobileNavbar';
import HomePage from './shared/components/HomePage';

function App() {
    const osType = type();
    const { toggleFullscreen } = useFullscreen();
    const isPhone = osType === 'android' || osType === 'ios';

    useEffect(() => {
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
        <MemoryRouter>
            <div className="h-screen w-screen relative overflow-hidden">
                {!isPhone && (
                    <WindowTitlebar/>
                )}
                
                <AnimatedRoutes />
            </div>
        </MemoryRouter>
    );
}

function AnimatedRoutes() {
    const location = useLocation();
    const isPlayer = location.pathname.startsWith('/play/');
    const isDetails = location.pathname.startsWith('/details/');
    const showMobileNavbar = isMobile && !isPlayer && !isDetails;

    return (
        <>
            <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ease-in-out ${isPlayer ? 'bg-transparent' : 'bg-background'}`} />
            
            <AnimatePresence>
                <Routes location={location} key={location.pathname}>
                    <Route path='/' element={
                        <PageWrapper>
                            <HomePage/>
                        </PageWrapper>
                    } />

                    <Route path='/details/:tmdbId' element={
                        <PageWrapper>
                            <MediaDetails />
                        </PageWrapper>
                    } />

                    <Route path='/settings' element={
                        <PageWrapper>
                            <SettingsPage/>
                        </PageWrapper>
                    } />

                    <Route path='/movies' element={
                        <PageWrapper>
                            <MoviesPage/>
                        </PageWrapper>
                    } />

                    <Route path='/shows' element={
                        <PageWrapper>
                            <ShowsPage/>
                        </PageWrapper>
                    } />

                    <Route path='/search' element={
                        <PageWrapper>
                            <SearchPage/>
                        </PageWrapper>
                    } />

                    <Route path='/play/:tmdbId' element={
                        <PageWrapper transparent>
                            <Player />
                        </PageWrapper>
                    } />
                </Routes>
            </AnimatePresence>

            {showMobileNavbar && <MobileNavbar />}
        </>
    );
}

export default App;