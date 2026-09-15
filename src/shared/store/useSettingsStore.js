import { create } from 'zustand';
import { load } from "@tauri-apps/plugin-store";
import { isMobile } from "../utils/PlatformUtils";
import { deepMerge } from '../utils/ObjectUtils';
import { useMemo } from 'react';

const DEFAULT_SETTINGS = {
    wakeUITimeout: isMobile ? 2000 : 700,
    videoLibraryFolders: [],
    subtitles: {
        enabled: true,
        size: 'Medium',
        color: 'White',
        backgroundOpacity: 0,
        preferredLanguage: 'en',
        preferClosedCaptions: false
    },
    audio: {
        maxVolume: 150,
        preferredLanguage: 'en'
    }
};

export const useSettingsStore = create((set, get) => ({
    settings: DEFAULT_SETTINGS,
    mediaOverrides: {},
    isLoaded: false,

    _settingsStore: null,
    _mediaStore: null,

    initAndLoadSettings: async () => {
        try {
            const settingsStore = await load('settings.json', { autoSave: false });
            const mediaStore = await load('media_settings.json', { autoSave: false });

            const savedSettings = { ...DEFAULT_SETTINGS };
            for (const key of Object.keys(DEFAULT_SETTINGS)) {
                const val = await settingsStore.get(key);
                if (val !== undefined && val !== null) {
                    savedSettings[key] = val;
                }
            }

            const mediaOverrides = {};
            const mediaEntries = await mediaStore.entries();
            for (const [key, value] of mediaEntries) {
                mediaOverrides[key] = value;
            }

            set({
                settings: savedSettings,
                mediaOverrides,
                _settingsStore: settingsStore,
                _mediaStore: mediaStore,
                isLoaded: true
            });
        } catch (error) {
            console.error("Failed to load settings", error);

            set({ isLoaded: true });
        }
    },

    updateSetting: async (key, value) => {
        const { _settingsStore, settings, mediaOverrides, _mediaStore } = get();
        const oldValue = settings[key];

        // Find which nested keys changed, or if it's a primitive that changed
        const changedNestedKeys = [];
        const isObjectSetting = oldValue && typeof oldValue === 'object' && !Array.isArray(oldValue) &&
            value && typeof value === 'object' && !Array.isArray(value);

        if (isObjectSetting) {
            for (const nestedKey in value) {
                if (value[nestedKey] !== oldValue[nestedKey]) {
                    changedNestedKeys.push(nestedKey);
                }
            }
        }

        set(state => ({ settings: { ...state.settings, [key]: value } }));
        if (_settingsStore) {
            await _settingsStore.set(key, value);
            await _settingsStore.save();
        }



        let updatedOverrides = { ...mediaOverrides };
        let hasChanges = false;

        for (const [tmdbId, override] of Object.entries(updatedOverrides)) {
            if (!(key in override)) continue;

            let overrideChanged = false;
            let newOverrideObj = { ...override };

            if (isObjectSetting && typeof override[key] === 'object' && !Array.isArray(override[key])) {
                const newSettingOverride = { ...override[key] };
                for (const changedKey of changedNestedKeys) {
                    if (changedKey in newSettingOverride) {
                        delete newSettingOverride[changedKey];
                        overrideChanged = true;
                    }
                }

                if (overrideChanged) {
                    if (Object.keys(newSettingOverride).length === 0) {
                        delete newOverrideObj[key];
                    } else {
                        newOverrideObj[key] = newSettingOverride;
                    }
                }
            } else if (oldValue !== value) {
                delete newOverrideObj[key];
                overrideChanged = true;
            }

            if (overrideChanged) {
                hasChanges = true;
                updatedOverrides[tmdbId] = newOverrideObj;
            }
        }

        if (hasChanges) {
            set({ mediaOverrides: updatedOverrides });
            if (_mediaStore) {
                for (const [tmdbId, override] of Object.entries(updatedOverrides)) {
                    if (Object.keys(override).length === 0) {
                        await _mediaStore.delete(tmdbId);
                    } else {
                        await _mediaStore.set(tmdbId, override);
                    }
                }

                for (const tmdbId of Object.keys(updatedOverrides)) {
                    if (Object.keys(updatedOverrides[tmdbId]).length === 0) {
                        delete updatedOverrides[tmdbId];
                    }
                }
                set({ mediaOverrides: updatedOverrides });

                await _mediaStore.save();
            }
        }

        return value;
    },


    updateMediaSetting: async (tmdbId, key, value) => {
        if (!tmdbId) return await get().updateSetting(key, value);

        const { _mediaStore, mediaOverrides } = get();
        const strId = tmdbId.toString();

        const currentOverride = mediaOverrides[strId] || {};
        const newOverride = { ...currentOverride, [key]: value };

        set(state => ({
            mediaOverrides: { ...state.mediaOverrides, [strId]: newOverride }
        }));

        if (_mediaStore) {
            await _mediaStore.set(strId, newOverride);
            await _mediaStore.save();
        }
        return value;
    },

    clearMediaSetting: async (tmdbId, key) => {
        if (!tmdbId) return;

        const { _mediaStore, mediaOverrides } = get();
        const strId = tmdbId.toString();

        if (!mediaOverrides[strId] || !(key in mediaOverrides[strId])) return;

        const currentOverride = { ...mediaOverrides[strId] };
        delete currentOverride[key];

        set(state => ({
            mediaOverrides: { ...state.mediaOverrides, [strId]: currentOverride }
        }));

        if (_mediaStore) {
            await _mediaStore.set(strId, currentOverride);
            await _mediaStore.save();
        }
    },

    addVideosFolder: async (newFolder) => {
        const { settings, updateSetting } = get();
        const currentFolders = settings.videoLibraryFolders || [];
        if (currentFolders.includes(newFolder)) return currentFolders;

        const updated = [...currentFolders, newFolder];
        await updateSetting('videoLibraryFolders', updated);
        return updated;
    },

    removeVideosFolder: async (folderToRemove) => {
        const { settings, updateSetting } = get();
        const currentFolders = settings.videoLibraryFolders || [];
        const updated = currentFolders.filter(f => f !== folderToRemove);
        await updateSetting('videoLibraryFolders', updated);
        return updated;
    }
}));

export function useSetting(key, defaultValue, tmdbId = null) {
    const globalSetting = useSettingsStore(state => state.settings[key]);
    const mediaOverride = useSettingsStore(state =>
        tmdbId ? state.mediaOverrides[tmdbId.toString()]?.[key] : undefined
    );
    const updateSetting = useSettingsStore(state => state.updateSetting);
    const updateMediaSetting = useSettingsStore(state => state.updateMediaSetting);

    const mergedValue = useMemo(() => {
        let finalVal = defaultValue;
        if (globalSetting !== undefined) {
            finalVal = globalSetting;
        }

        if (mediaOverride !== undefined) {
            if (finalVal && typeof finalVal === 'object' && !Array.isArray(finalVal) &&
                mediaOverride && typeof mediaOverride === 'object' && !Array.isArray(mediaOverride)) {
                finalVal = deepMerge(finalVal, mediaOverride);
            } else {
                finalVal = mediaOverride;
            }
        }
        return finalVal;
    }, [globalSetting, mediaOverride, defaultValue]);

    const setValue = (newValueOrUpdater) => {
        const nextValue = typeof newValueOrUpdater === 'function'
            ? newValueOrUpdater(mergedValue)
            : newValueOrUpdater;

        if (tmdbId) {
            return updateMediaSetting(tmdbId, key, nextValue);
        } else {
            return updateSetting(key, nextValue);
        }
    };

    return [mergedValue, setValue];
}
