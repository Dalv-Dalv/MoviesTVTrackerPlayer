import { ArrowLeftIcon, FolderIcon, LayoutIcon, PlayIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom"
import { useVideoLibrary } from "../contexts/VideoLibraryContext";
import { motion } from "framer-motion";

function SettingsButton({ label, Icon, onClick }) {
    return (
        <button className="w-full p-4 rounded-full text-lg flex items-center gap-4 transition-colors bg-transparent active:bg-white/8" onClick={onClick}>
            <Icon size={28} className="text-muted" />
            <span> {label} </span>
        </button>
    );
}

export default function SettingsPage({ className = '' }) {
    const navigate = useNavigate();

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
                    Settings
                </span>
            </div>

            <div className="flex flex-col gap-2 items-center">
                <SettingsButton label={'Folders Scanning'} Icon={FolderIcon} onClick={() => navigate('/settings/folders')} />
                <SettingsButton label={'Player'} Icon={PlayIcon} onClick={() => navigate('/settings/player')} />
                <SettingsButton label={'Interface'} Icon={LayoutIcon} onClick={() => navigate('/settings/interface')} />
            </div>
        </motion.div>
    )
}