import React from 'react';
import { FolderIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useSetting } from '../../../shared/contexts/SettingsContext';
import { useVideoLibrary } from '../../../shared/contexts/VideoLibraryContext';

export default function FoldersTab() {
    const [folders, setFolders] = useSetting('videoLibraryFolders', []);
    const { addFolderAndScan, rescanLibrary, clearCacheAndRescan, isScanning } = useVideoLibrary();

    const handleRemoveFolder = (folderToRemove) => {
        setFolders(prevFolders => prevFolders.filter(f => f !== folderToRemove));
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

            <section>
                <span className="text-sm font-semibold tracking-wide text-muted mb-3 block">
                    Library Actions
                </span>
                <button
                    onClick={clearCacheAndRescan}
                    disabled={isScanning}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-colors bg-white/5 hover:bg-white/10 active:bg-white/15 text-red-400 disabled:opacity-50"
                >
                    <span className="font-semibold">{isScanning ? 'Clearing & Scanning...' : 'Clear Cache & Rescan'}</span>
                    <TrashIcon size={20} />
                </button>
            </section>
        </div>
    );
}
