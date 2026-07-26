import { load } from "@tauri-apps/plugin-store";
import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
    wakeUITimeout: 700
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
    };

    const saveSettings = async () => {
        if (storeInstance) {
            await storeInstance.save();
        }
    };

    const updateAndSaveSetting = async (key, value) => {
        await updateSetting(key, value);
        await saveSettings();
    };

    if (!isLoaded) return <div className="h-screen w-screen bg-neutral-900" />;

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, updateAndSaveSetting }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);