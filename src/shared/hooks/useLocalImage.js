import { useState, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';

export function useLocalImage(relativePath) {
    const [imgUrl, setImgUrl] = useState(null);

    useEffect(() => {
        if (!relativePath) {
            setImgUrl(null);
            return;
        }

        async function resolveImagePath() {
            try {
                const appData = await appDataDir();
                
                const absolutePath = await join(appData, relativePath);
                
                const assetUrl = convertFileSrc(absolutePath);
                
                setImgUrl(assetUrl);
            } catch (error) {
                console.error("Failed to load local image:", error);
            }
        }

        resolveImagePath();
    }, [relativePath]);

    return imgUrl;
}