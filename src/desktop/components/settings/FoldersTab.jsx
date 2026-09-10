import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderIcon, PlusIcon, TrashIcon, FadersHorizontalIcon } from "@phosphor-icons/react";
import { useSetting } from '../../../shared/contexts/SettingsContext';
import { useLibraryStore } from '../../../shared/store/useLibraryStore';
import { useTMDB } from '../../../shared/hooks/useTMDB';
import { open } from '@tauri-apps/plugin-dialog';

export default function FoldersTab() {
    const [folders, setFolders] = useSetting('videoLibraryFolders', []);
    const rescanLibrary = useLibraryStore(state => state.rescan);
    const clearCacheAndRescan = useLibraryStore(state => state.clearCacheAndRescan);
    const isScanning = useLibraryStore(state => state.isScanning);
    const navigate = useNavigate();
    const tmdb = useTMDB();

    const addFolderAndScan = async () => {
        const selectedFolder = await open({ directory: true, multiple: false });
        if (!selectedFolder) return;
        const newFolders = [...new Set([...folders, selectedFolder])];
        setFolders(newFolders);
    };

    const handleRemoveFolder = (folderToRemove) => {
        setFolders(prevFolders => prevFolders.filter(f => f !== folderToRemove));
    };

    const handleClearAndRescan = () => {
        clearCacheAndRescan();
    };

    return (
        <div className="flex flex-col h-full text-body p-6">
            <h2 className="font-semibold text-2xl tracking-wide mb-6">Folders Scanning</h2>
            
            <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold tracking-wide text-muted">
                        Monitored Folders
                    </span>
                    <button
                        onClick={addFolderAndScan}
                        className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
                    >
                        <PlusIcon size={16} weight="bold" />
                        Add Folders
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {folders.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-muted text-sm">
                            No folders selected. Click "Add Folders" to add a directory.
                        </div>
                    ) : (
                        folders.map((folderPath) => (
                            <div
                                key={folderPath}
                                className="flex items-center justify-between pl-3.5 rounded-xl bg-white/5 border border-white/5"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FolderIcon size={22} className="text-primary shrink-0" />
                                    <span className="truncate">{folderPath.replace(/[\/]+$/, '').split('/').pop()}</span>
                                </div>

                                <button
                                    onClick={() => handleRemoveFolder(folderPath)}
                                    className="p-4 text-muted hover:text-red-400 active:bg-white/10 rounded-lg transition-colors"
                                    title="Remove folder"
                                >
                                    <TrashIcon size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className='flex flex-col gap-3'>
                <span className="text-sm font-semibold tracking-wide text-muted block">
                    Library Actions
                </span>

                <button
                    onClick={() => navigate('/library-manager')}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-colors bg-white/5 hover:bg-white/10 active:bg-white/15 text-body border border-white/5"
                >
                    <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold">Library Manager</span>
                        <span className="text-xs text-muted text-left">Audit miscategorized files and remotely assign them to correct TMDB entries in bulk.</span>
                    </div>
                    <FadersHorizontalIcon size={24} className="text-primary opacity-80" />
                </button>

                <button
                    onClick={handleClearAndRescan}
                    disabled={isScanning}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-colors bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 text-red-400 disabled:opacity-50"
                >
                    <span className="font-semibold">{isScanning ? 'Clearing & Scanning...' : 'Clear Cache & Rescan'}</span>
                    <TrashIcon size={20} />
                </button>
            </section>
        </div>
    );
}
