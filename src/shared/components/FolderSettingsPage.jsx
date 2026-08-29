import { ArrowLeftIcon, FolderIcon, LayoutIcon, PlayIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom"
import { useVideoLibrary } from "../contexts/VideoLibraryContext";
import { motion } from "framer-motion";
import { useSetting } from "../contexts/SettingsContext";

function SettingsButton({ label, Icon }) {
    return (
        <div className="w-full p-4 rounded-full text-lg flex items-center gap-4 transition-colors bg-transparent active:bg-white/8">
            <Icon size={28} className="text-muted" />
            <span> {label} </span>
        </div>
    );
}

export default function FolderSettingsPage({ className = '' }) {
    const navigate = useNavigate();

    const [folders, setFolders] = useSetting('videoLibraryFolders', []);
    const { addFolderAndScan, rescanLibrary, isScanning } = useVideoLibrary();

    const handleRemoveFolder = (folderToRemove) => {
        setFolders(prevFolders => prevFolders.filter(f => f !== folderToRemove));
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-body p-4 px-6 relative"
        >
            <div className="flex items-center gap-2 mb-6">
                <button className="p-2 rounded-full aspect-square bg-white/0 transition-colors active:bg-white/10" onClick={() => navigate(-1)}>
                    <ArrowLeftIcon size={24} weight="bold" className="text-muted" />
                </button>
                <span className="font-semibold text-2xl tracking-wide">
                    Folders Scanning
                </span>
            </div>

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
                                    className="p-4 text-muted active:text-red-400 active:bg-white/10 rounded-lg transition-colors"
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
                <span className="text-sm font-semibold tracking-wide text-muted">
                    Scanning
                </span>
            </section>
        </motion.div>
    )
}