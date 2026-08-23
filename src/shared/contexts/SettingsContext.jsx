import { load } from "@tauri-apps/plugin-store";
import { createContext, useContext, useEffect, useState } from "react";
import { isMobile } from "../utils/PlatformUtils";

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
    wakeUITimeout: isMobile ? 2000 : 700,
    videoLibraryFolders: []
};

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);
    
    const [storeInstance, setStoreInstance] = useState(null);

    useEffect(() => {
        async function initAndLoadSettings() {
            const store = await load('settings.json', { autoSave: false });
            
            const savedSettings = {};

            for (const key of Object.keys(DEFAULT_SETTINGS)) {
                const val = await store.get(key);
                savedSettings[key] = val ?? DEFAULT_SETTINGS[key];
            }

            setStoreInstance(store);
            setSettings(savedSettings);
            setIsLoaded(true);
        }

        initAndLoadSettings();
    }, []);

    const updateSetting = async (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        if (storeInstance) {
            await storeInstance.set(key, value);
        }
        return value;
    };

    const saveSettings = async () => {
        if (storeInstance) {
            await storeInstance.save();
        }
    };

    const updateAndSaveSetting = async (key, value) => {
        await updateSetting(key, value);
        await saveSettings();
        return value;
    };

    const addVideosFolder = async (newFolder) => {
        const currentFolders = settings.videoLibraryFolders || [];
        
        if (currentFolders.includes(newFolder)) return currentFolders;

        const updated = [...currentFolders, newFolder];
        await updateAndSaveSetting('videoLibraryFolders', updated);
        return updated;
    };

    const removeVideosFolder = async (folderToRemove) => {
        const currentFolders = settings.videoLibraryFolders || [];
        const updated = currentFolders.filter(f => f !== folderToRemove);
        await updateAndSaveSetting('videoLibraryFolders', updated);
        return updated;
    };

    if (!isLoaded) return <div className="h-screen w-screen bg-neutral-900" />;

    return (
        <SettingsContext.Provider value={{ 
                settings,
                updateSetting,
                updateAndSaveSetting,
                addVideosFolder,
                removeVideosFolder
            }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSetting(key, defaultValue) {
    const { settings, updateAndSaveSetting } = useSettings();
    
    const value = settings[key] !== undefined ? settings[key] : defaultValue;
    
    const setValue = (newValueOrUpdater) => {
        const nextValue = typeof newValueOrUpdater === 'function'
            ? newValueOrUpdater(settings[key] !== undefined ? settings[key] : defaultValue)
            : newValueOrUpdater;
            
        return updateAndSaveSetting(key, nextValue);
    };
    
    return [value, setValue];
}

export const useSettings = () => useContext(SettingsContext);