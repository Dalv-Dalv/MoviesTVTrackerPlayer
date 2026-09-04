import React, { useState } from 'react';
import { XIcon, FolderIcon, PlayIcon, LayoutIcon } from "@phosphor-icons/react";
import { useLocation, useNavigate } from 'react-router-dom';

import { Modal } from '../../shared/components/Modal';

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
        <Modal 
            isOpen={isOpen} 
            onClose={closeSettings} 
            hideHeader 
            unstyledBody
            className="w-11/12 md:w-3/4 max-w-5xl h-[80vh] bg-background/90"
        >
            <div className="flex flex-row w-full h-full">
                {/* Sidebar */}
                <div className="w-64 border-r bg-white/5 border-white/10 p-4 flex flex-col gap-2 text-body shrink-0">
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
            </div>
        </Modal>
    );
}
