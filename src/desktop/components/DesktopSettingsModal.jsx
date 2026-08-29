import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, FolderIcon, PlayIcon, LayoutIcon } from "@phosphor-icons/react";
import { useLocation, useNavigate } from 'react-router-dom';

import FoldersTab from './settings/FoldersTab';
import PlayerTab from './settings/PlayerTab';
import InterfaceTab from './settings/InterfaceTab';



const TABS = [
    { id: 'folders', label: 'Folders Scanning', icon: FolderIcon, component: FoldersTab },
    { id: 'player', label: 'Player', icon: PlayIcon, component: PlayerTab },
    { id: 'interface', label: 'Interface', icon: LayoutIcon, component: InterfaceTab },
];

export default function DesktopSettingsModal() {
    const location = useLocation();
    const navigate = useNavigate();
    const isOpen = location.hash === '#settings';

    const [activeTab, setActiveTab] = useState(TABS[0].id);

    const closeSettings = () => {
        navigate(location.pathname + location.search, { replace: true });
    };

    const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || FoldersTab;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-80 flex items-center justify-center pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSettings}
                        className="absolute inset-0 bg-transparent"
                    />


                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-2/3 h-3/4 max-w-[90vw] max-h-[85vh] bg-background/90 border border-white/20 rounded-2xl shadow-2xl shadow-background flex overflow-hidden flex-row backdrop-blur-xl"
                    >
                        {/* Sidebar */}
                        <div className="w-64 border-r bg-white/5 border-white/10 p-4 flex flex-col gap-2 text-body">
                            <div className="flex items-center gap-3 mb-6 px-2 mt-2 noselect">
                                <h1 className="font-bold text-xl tracking-wide">Settings</h1>
                            </div>

                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-muted hover:text-body'}`}
                                    >
                                        <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div className="flex-1 relative overflow-y-auto">
                            <ActiveComponent />

                            {/* Close button */}
                            <button
                                onClick={closeSettings}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-muted hover:text-body"
                            >
                                <XIcon size={24} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
