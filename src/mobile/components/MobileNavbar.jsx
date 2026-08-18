import { DotsThreeVerticalIcon, FilmSlateIcon, GearIcon, HouseIcon, MagnifyingGlassIcon, TelevisionIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";


const navButtons = [
    {label: 'Home',     Icon: HouseIcon,           routingPath: '/'},
    {label: 'Movies',   Icon: FilmSlateIcon,       routingPath: '/movies'},
    {label: 'Shows',    Icon: TelevisionIcon,      routingPath: '/shows'},
    {label: 'Search',   Icon: MagnifyingGlassIcon, routingPath: '/search'}
];

function NavbarButton({ label, Icon, routingPath, isActive }) {
    const navigate = useNavigate();

    return (
        <div className={`relative z-10 flex flex-col justify-center items-center px-3 transition-colors duration-300 ${isActive ? 'text-body' : 'text-muted'}`} onClick={() => navigate(routingPath)}>
            <div className={`absolute inset-0 border border-t-0 border-white/80 pointer-events-none transition-opacity duration-300 bg-[radial-gradient(circle_150px_at_50%_-130%,transparent_50%,white_100%)] ${isActive ? 'opacity-20' : 'opacity-0'}`}/>

            <Icon size={28} weight={isActive ? 'fill' : 'regular'}/>
            <span className="text-xs">
                {label}
            </span>
        </div>
    );
}

export default function MobileNavbar({ className = '' }) {
    const location = useLocation();
    const activeIndex = navButtons.findIndex(btn => btn.routingPath === location.pathname);

    const [isVisible, setIsVisible] = useState(true);
    const [isAtTop, setIsAtTop] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const lastScrollY = useRef(0);
    const scrollDirection = useRef('down');
    const scrollAnchor = useRef(0);

    const HIDE_THRESHOLD = 200;
    const SHOW_THRESHOLD = 40;

    useEffect(() => {
        setIsVisible(true);
        setIsAtTop(true);
        setIsMenuOpen(false);
        lastScrollY.current = 0;
        scrollAnchor.current = 0;
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = (e) => {
            const currentScrollY = e.detail.scrollTop;
            const isScrollingDown = currentScrollY > lastScrollY.current;

            setIsAtTop(currentScrollY < 20);

            if (isScrollingDown && scrollDirection.current === 'up') {
                scrollDirection.current = 'down';
                scrollAnchor.current = currentScrollY;
            } else if (!isScrollingDown && scrollDirection.current === 'down') {
                scrollDirection.current = 'up';
                scrollAnchor.current = currentScrollY;
            }

            if (currentScrollY < 50) {
                setIsVisible(true);
            } else {
                if (scrollDirection.current === 'down') {
                    if (currentScrollY - scrollAnchor.current > HIDE_THRESHOLD) {
                        setIsVisible(false);
                        setIsMenuOpen(false);
                    }
                } else {
                    if (scrollAnchor.current - currentScrollY > SHOW_THRESHOLD) {
                        setIsVisible(true);
                    }
                }
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('page-scroll', handleScroll);
        return () => window.removeEventListener('page-scroll', handleScroll);
    }, []);

    return (
        <>
            <div className={`fixed top-8 z-50 flex items-center justify-between px-4 transition-all duration-300 ease-in-out
                ${!isVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
                ${isAtTop 
                    ? 'top-0 left-0 right-0 h-16 rounded-none bg-linear-to-b from-black/80 to-transparent' 
                    : 'top-2 left-2 right-2 h-14 rounded-full backdrop-blur-md border border-white/10 bg-black/40 shadow-lg'
                }
            `}>
                <div className="font-bold text-lg text-white tracking-wide">
                    BRAND
                </div>

                {/* Actions / Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-1 rounded-full transition-colors ${isMenuOpen ? 'bg-white/20 text-white' : 'text-muted hover:text-white'}`}
                    >
                        <DotsThreeVerticalIcon size={28} weight="bold"/>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <>
                            {/* Invisible overlay to catch clicks outside the menu */}
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setIsMenuOpen(false)} 
                            />
                            
                            {/* Menu Box */}
                            <div className="absolute top-full right-0 mt-3 w-48 rounded-xl backdrop-blur-xl bg-black/80 border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col">
                                <button 
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        navigate('/settings');
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                                >
                                    <GearIcon size={20} />
                                    Settings
                                </button>
                                {/* Add more dropdown items here if needed */}
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <div className="fixed bottom-1 left-1 right-1 h-14 m-1 rounded-full backdrop-blur-md grid grid-cols-4 z-50 overflow-hidden border border-white/10">
                {navButtons.map((elem, index) => (
                    <NavbarButton 
                        key={elem.label} 
                        label={elem.label} 
                        Icon={elem.Icon} 
                        routingPath={elem.routingPath}
                        isActive={index === activeIndex}
                    />
                ))}
            </div>
        </>
    )
}