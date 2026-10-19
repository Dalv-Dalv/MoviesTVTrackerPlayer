import { CompassIcon, GearIcon, HouseIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { hapticMedium } from "../../shared/utils/HapticUtils";

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

        if (routingPath === '/search') {
            if (!isActive) {
                navigate('/search');
                return;
            }

            window.dispatchEvent(new CustomEvent('mobile-search-clear'));
            return;
        }

        if (!isActive) {
            navigate(routingPath);
        }
    };

    const handlePointerDown = (e) => {
        if (routingPath === '/search' && isActive) {
            e.preventDefault();
        }
    };

    return (
        <div
            className={`h-full flex-1 relative z-10 flex flex-col justify-center items-center transition-colors duration-300 ease-in-out cursor-pointer select-none ${isActive ? 'text-body' : 'text-muted'}`}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
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
            className={`fixed bottom-0 inset-x-0 pb-[calc(var(--safe-bottom))] z-50 pointer-events-none bg-linear-to-t from-background to-transparent ${className}`}
        >
            <div className="h-14 m-2 rounded-full overflow-hidden flex items-center shadow-xl pointer-events-auto relative">
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

                <div className="absolute -inset-8 bg-surface/70 backdrop-blur-lg -z-10" />

                <div className="absolute inset-0 z-10 rounded-full ring ring-inset ring-white/5 shadow-[inset_0_3px_5px_rgba(255,255,255,0.1)] pointer-events-none" />
            </div>
        </motion.div>
    );
}