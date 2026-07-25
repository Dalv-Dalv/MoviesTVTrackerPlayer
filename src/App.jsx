import React from 'react';
import { type } from '@tauri-apps/plugin-os';

import MobileApp from './mobile/MobileApp';
import DesktopApp from './desktop/DesktopApp';

function App() {
	const osType = type();

    if (osType === 'android' || osType === 'ios')
        return <MobileApp/>
    else
        return <DesktopApp/>
}

export default App;