import React, { useEffect } from 'react';
import { type } from '@tauri-apps/plugin-os';

import MobileApp from './mobile/MobileApp';
import DesktopApp from './desktop/DesktopApp';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from './shared/PageWrapper';
import { MediaDetails } from './shared/MediaDetails';
import { Player } from './desktop/Player';
import { WindowTitlebar } from './desktop/WindowTitlebar';
import { useFullscreen } from './shared/hooks/useFullscreen';

function App() {
    const osType = type();
    const { toggleFullscreen } = useFullscreen();

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
                {osType !== 'android' && osType !== 'ios' && (
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

    return (
        <>
            <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ease-in-out ${isPlayer ? 'bg-transparent' : 'bg-background'}`} />
            <AnimatePresence>
                <Routes location={location} key={location.pathname}>
                    <Route path='/' element={
                        <PageWrapper>
                            <DesktopApp />
                        </PageWrapper>
                    } />

                    <Route path='/details/:tmdbId' element={
                        <PageWrapper>
                            <MediaDetails />
                        </PageWrapper>
                    } />

                    <Route path='/settings' element={
                        <PageWrapper>
                            {/* TODO */}
                        </PageWrapper>
                    } />

                    <Route path='/play/:tmdbId' element={
                        <PageWrapper transparent>
                            <Player />
                        </PageWrapper>
                    } />
                </Routes>
            </AnimatePresence>
        </>
    );
}

export default App;