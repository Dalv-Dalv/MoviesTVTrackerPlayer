import { motion } from "framer-motion";
import { GearIcon } from "@phosphor-icons/react";
import DesktopSearchBar from "./DesktopSearchBar";
import { useNavigate } from "react-router-dom";

function NavbarButton({ children, className = '', onClick }) {
    return (
        <div onClick={onClick} className={`relative overflow-hidden h-full p-2 group rounded-full text-body/50 ring-1 ring-inset ring-white/5 hover:ring-white/10 transition-colors duration-300 pointer-events-auto ${onClick ? 'cursor-pointer' : ''} ${className}`}>
            <div className="absolute -inset-8 bg-surface/30 group-hover:bg-surface/50 backdrop-blur-lg transition-colors duration-200 -z-10"></div>

            {children}
        </div>
    );
}

export default function DesktopNavbar() {
    const navigate = useNavigate();
    return (
        <motion.div
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: -50, transition: { duration: 0.2 } }}
            className={`absolute top-5 z-50 w-full flex items-start justify-between p-4 py-0 noselect gap-2 h-12 pointer-events-none`}
        >
            <NavbarButton className='flex gap-2 px-4'>
                <button className="relative">Library</button>
                <button className="relative">Explore</button>
            </NavbarButton>

            <NavbarButton className='flex gap-2 px-4'>
                <button className="relative">Movies</button>
                <button className="relative">Shows</button>
            </NavbarButton>

            <DesktopSearchBar />

            <NavbarButton className='aspect-square flex items-center justify-center' onClick={() => navigate('#settings')}>
                <GearIcon size={28} className='relative text-body/50 transition-colors duration-200 group-hover:text-body/80' />
            </NavbarButton>
        </motion.div>
    );
}
