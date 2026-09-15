import { useState, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';

export function useLocalImage(imagePath) {
    const isDirectUrl = (path) => path && (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:'));
    
    const [imgUrl, setImgUrl] = useState(() => isDirectUrl(imagePath) ? imagePath : null);

    useEffect(() => {
        if (!imagePath) {
            setImgUrl(null);
            return;
        }

        if (isDirectUrl(imagePath)) {
            setImgUrl(imagePath);
            return;
        }

        async function resolveImagePath() {
            try {
                const appData = await appDataDir();
                
                const absolutePath = await join(appData, imagePath);
                
                const assetUrl = convertFileSrc(absolutePath);
                
                setImgUrl(assetUrl);
            } catch (error) {
                console.error("Failed to load local image:", error);
            }
        }

        resolveImagePath();
    }, [imagePath]);

    return imgUrl;
}