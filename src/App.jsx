import React from 'react';
import { type } from '@tauri-apps/plugin-os';

import MobileApp from './mobile/MobileApp';
import DesktopApp from './desktop/DesktopApp';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from './shared/PageWrapper';
import { MediaDetails } from './shared/MediaDetails';

function App() {
	const osType = type();

    // if (osType === 'android' || osType === 'ios')
    //     return <MobileApp/>
    // else
    //     return <DesktopApp/>

    return (
        <MemoryRouter>
            <div className="h-screen w-screen relative overflow-hidden bg-background">
                <AnimatedRoutes/>
            </div>
        </MemoryRouter>  
    );
}

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence>
            <Routes location={location} key={location.pathname}>
                <Route path='/' element={
                    <PageWrapper>
                        <DesktopApp/>
                    </PageWrapper>
                }/>

                <Route path='/details/:tmdbId' element={
                    <PageWrapper>
                        <MediaDetails/>
                    </PageWrapper>
                }/>

                <Route path='/settings' element={
                    <PageWrapper>
                        {/* TODO */}
                    </PageWrapper>
                }/>
            </Routes>
        </AnimatePresence>  
    );
}

export default App;