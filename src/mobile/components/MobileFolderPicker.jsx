import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { useSettings } from '../../shared/contexts/SettingsContext';
import { CaretRightIcon, CheckIcon, DotOutlineIcon } from '@phosphor-icons/react';

const FolderTreeNode = ({ node, selectedPaths, suppressedPaths, toggleFolder}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = Object.keys(node.children).length > 0;
    const isSelected = selectedPaths.has(node.fullPath);
    const isSuppressed = suppressedPaths?.has(node.fullPath);

    return (
        <div className="relative flex flex-col">
            <div className={`absolute pointer-events-none inset-0 rounded-lg bg-linear-to-r from-primary/30 to-primary/5 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0'}`}/>
            <div 
                className={`relative flex items-center pl-1 pr-3 py-1.5 my-0.5 rounded-lg transition-colors duration-300 ${isSelected ? 'active:bg-primary/10' : 'active:bg-white/10'}`}
            >
                
                <button 
                    className={`w-8 h-8 flex items-center justify-center ${isSelected ? 'text-primary' : 'text-muted'}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                    disabled={!hasChildren}
                >

                    {hasChildren ? (
                        <CaretRightIcon size={20} className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}/>
                    ) : (
                        <DotOutlineIcon size={32} weight='light'/>
                    )}
                </button>

                <div className="flex-1 ml-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <p className={`font-semibold text-lg ${isSelected ? 'text-primary' : 'text-body'}`}>
                        {node.name}
                    </p>
                    {!hasChildren && (
                        <p className="-mt-1 text-xs text-muted">{node.count} videos</p>
                    )}
                </div>
                
                <div 
                    onClick={() => toggleFolder(node.fullPath)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary border-primary' : (isSuppressed ? 'bg-muted border-muted' : 'border-muted')
                    }`}
                >
                    <div className='absolute right-0 top-0 bottom-0 w-16 transparent'/> {/* extended tap area  */}

                    {(isSelected || isSuppressed) && <CheckIcon size={18} className='text-black' weight='bold'/>}
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className={`flex gap-0.5 flex-col ml-5 ${isSelected ? 'pointer-events-none opacity-60' : ''}`}>
                    {Object.values(node.children)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(child => (
                            <FolderTreeNode 
                                key={child.fullPath} 
                                node={child} 
                                selectedPaths={selectedPaths} 
                                suppressedPaths={suppressedPaths}
                                toggleFolder={toggleFolder}
                            />
                        ))}
                </div>
            )}
        </div>
    );
};


export function MobileFolderPicker({ onClose, onSaveComplete }) {
    const { settings, updateAndSaveSetting } = useSettings();
    const [treeData, setTreeData] = useState([]);
    const [selectedPaths, setSelectedPaths] = useState(new Set());
    const [suppressedPaths, setSuppressedPaths] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function discoverFolders() {
            try {
                const response = await invoke('plugin:android-mediastore|get_media_files', { 
                    payload: { mediaType: "video/*" } 
                });
                
                const rootNode = { children: {} };
                const androidRootPrefix = "/storage/emulated/0";
                
                for (const file of response.files) {
                    if (!file.filePath) continue; 
                    
                    const dirPath = file.filePath.substring(0, file.filePath.lastIndexOf('/'));
                    
                    let visualPath = dirPath;
                    if (visualPath.startsWith(androidRootPrefix)) {
                        visualPath = visualPath.replace(androidRootPrefix, "");
                    }

                    if (visualPath.startsWith("/")) visualPath = visualPath.substring(1);
                    if (visualPath === "") continue; 

                    const parts = visualPath.split('/');
                    
                    let currentLevel = rootNode.children;
                    let builtPath = dirPath.startsWith(androidRootPrefix) ? androidRootPrefix : "";

                    for (const part of parts) {
                        builtPath += "/" + part;
                        
                        if (!currentLevel[part]) {
                            currentLevel[part] = {
                                name: part,
                                fullPath: builtPath,
                                count: 0,
                                children: {}
                            };
                        }
                        
                        currentLevel[part].count++;
                        currentLevel = currentLevel[part].children;
                    }
                }

                const sortedRootFolders = Object.values(rootNode.children).sort((a, b) => a.name.localeCompare(b.name));
                
                setTreeData(sortedRootFolders);
                setSelectedPaths(new Set(settings.videoLibraryFolders || []));
            } catch (err) {
                console.error("MediaStore query failed", err);
            } finally {
                setIsLoading(false);
            }
        }
        
        discoverFolders();
    }, [settings.videoLibraryFolders]);

    const toggleFolder = (path) => {
        const paths = new Set(selectedPaths);
        const hidden = new Set(suppressedPaths);
        if (paths.has(path)) {
            paths.delete(path);

            for (const hiddenPath of hidden) {
                if (hiddenPath.startsWith(path + '/')) {
                    paths.add(hiddenPath);
                    hidden.delete(hiddenPath);
                }
            }
        } else {
            for (const selectedPath of paths) {
                if (selectedPath.startsWith(path + '/')) {
                    paths.delete(selectedPath);
                    hidden.add(selectedPath);
                }
            }
            
            paths.add(path);
        }

        setSelectedPaths(paths);
        setSuppressedPaths(hidden);
    };

    const handleSave = async () => {
        await updateAndSaveSetting('videoLibraryFolders', Array.from(selectedPaths));
        onClose();
        onSaveComplete(); 
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 1.05, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-background z-50 flex flex-col text-body overflow-hidden"
        >
            <div className="p-6 pt-12 pb-4 overflow-hidden border-b border-white/20 shadow-[0_0_20px_10px_rgba(0,0,0,1.0)]">
                <h2 className="text-2xl font-bold">Select Media Folders</h2>
                <p className="text-sm text-muted mt-1">
                    Avoid selecting folders where videos other than movies and shows will be.
                </p>
            </div>
            
            <div className="relative -z-20 flex-1 overflow-y-scroll overscroll-y-contain p-2 pr-1">
                {!isLoading && (
                    treeData.map(node => (
                        <FolderTreeNode 
                            key={node.fullPath} 
                            node={node} 
                            selectedPaths={selectedPaths}
                            suppressedPaths={suppressedPaths} 
                            toggleFolder={toggleFolder} 
                        />
                    ))
                )}
            </div>

            <div className="flex justify-between items-center p-6 pl-2 pt-4 overflow-hidden border-t border-white/20 shadow-[0_0_20px_10px_rgba(0,0,0,1.0)]">
                <span className='text-muted text-right flex-1 pr-3'>
                    <span>{selectedPaths.size}</span> Selected
                </span>

                <div className='flex justify-end gap-4'>
                    <button onClick={onClose} className="px-5 py-3 bg-white/10 font-bold rounded-md active:bg-white/20">
                        Cancel
                    </button>
                    
                    <button onClick={handleSave} className="px-5 py-3 bg-body text-black font-bold rounded-md active:bg-white/80">
                        Save & Scan
                    </button>
                </div>
            </div>
        </motion.div>
    );
}