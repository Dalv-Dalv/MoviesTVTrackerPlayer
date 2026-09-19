import { ArrowsClockwiseIcon, CompassIcon, DotsThreeVerticalIcon, FilmSlateIcon, FilmStripIcon, GearIcon, HouseIcon, MagnifyingGlassIcon, TelevisionIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HomeIcon } from "lucide-react";

const navButtons = [
    { Icon: HouseIcon, routingPath: '/' },
    { Icon: CompassIcon, routingPath: '/movies' },
    { Icon: MagnifyingGlassIcon, routingPath: '/search' },
    { Icon: GearIcon, routingPath: '/settings' }
];

function NavbarButton({ Icon, routingPath, isActive, isFirst, isLast }) {
    const navigate = useNavigate();

    const handleClick = (e) => {
        e.stopPropagation();
        if(!isActive) navigate(routingPath);
    }

    return (
        <div 
            className={`h-full flex-1 relative z-10 flex flex-col justify-center items-center transition-colors duration-300 ease-in-out ${isActive ? 'text-body' : 'text-muted'}`} 
            onClick={handleClick}
        >
            <div
                className={`absolute inset-0 border border-t-0 border-white/80 pointer-events-none transition-opacity duration-300 bg-[radial-gradient(circle_150px_at_50%_-130%,transparent_50%,white_100%)] 
                ${isActive ? 'opacity-20' : 'opacity-0'} 
                ${isFirst ? 'border-l-0' : ''} 
                ${isLast ? 'border-r-0' : ''}`}
            />

            <Icon size={28} weight={isActive ? 'fill' : 'regular'} />

            <div
                className={`absolute z-10 inset-0 pointer-events-none transition-opacity duration-300 shadow-[inset_0_-2px_4px_rgba(255,255,255,0.1)]
                ${isActive ? 'opacity-100' : 'opacity-0'} 
                ${isFirst ? 'rounded-l-full' : ''} 
                ${isLast ? 'rounded-r-full' : ''}`}
            />
        </div>
    );
}

export default function MobileNavbar({ className = '' }) {
    const location = useLocation();
    const activeIndex = navButtons.findIndex(btn => btn.routingPath === location.pathname);

    return (
        <motion.div
            initial={{ "--nav-exit": 0 }}
            animate={{ "--nav-exit": 1 }}
            exit={{ "--nav-exit": 0, transition: { duration: 0.5 } }}
            className={`fixed bottom-1 left-1 right-1 h-14 m-1 rounded-full border border-white/10 overflow-hidden flex items-center z-50 ${className}`}
        >
            {navButtons.map((elem, index) => (
                <NavbarButton
                    key={elem.routingPath}
                    Icon={elem.Icon}
                    routingPath={elem.routingPath}
                    isActive={index === activeIndex}
                    isFirst={index === 0}
                    isLast={index === navButtons.length - 1}
                />
            ))}

            <div className="absolute -inset-8 bg-black/70 backdrop-blur-lg -z-10"/>
        </motion.div>
    )
}