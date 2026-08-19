import { ArrowsClockwiseIcon, DotsThreeVerticalIcon, FilmSlateIcon, FilmStripIcon, GearIcon, HouseIcon, MagnifyingGlassIcon, TelevisionIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";


const navButtons = [
    { label: 'Home', Icon: HouseIcon, routingPath: '/' },
    { label: 'Movies', Icon: FilmSlateIcon, routingPath: '/movies' },
    { label: 'Shows', Icon: TelevisionIcon, routingPath: '/shows' },
    { label: 'Search', Icon: MagnifyingGlassIcon, routingPath: '/search' }
];

function NavbarButton({ label, Icon, routingPath, isActive }) {
    const navigate = useNavigate();

    return (
        <div className={`relative z-10 flex flex-col justify-center items-center px-3 transition-colors duration-300 ${isActive ? 'text-body' : 'text-muted'}`} onClick={() => navigate(routingPath)}>
            <div className={`absolute inset-0 border border-t-0 border-white/80 pointer-events-none transition-opacity duration-300 bg-[radial-gradient(circle_150px_at_50%_-130%,transparent_50%,white_100%)] ${isActive ? 'opacity-20' : 'opacity-0'}`} />

            <Icon size={28} weight={isActive ? 'fill' : 'regular'} />
            <span className="text-xs">
                {label}
            </span>
        </div>
    );
}

export default function MobileNavbar({ className = '' }) {
    const location = useLocation();
    const navigate = useNavigate();
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

            setIsAtTop(currentScrollY < 5);

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
            <motion.div 
                initial={{ y: -100, opacity: 0 }}
                animate={{ 
                    y: isVisible ? 0 : -100, 
                    opacity: isVisible ? 1 : 0 
                }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                
                className={`fixed z-50 flex items-center justify-between px-4 transition-[top,left,right,height,padding] duration-300 ease-in-out
                    ${isAtTop
                        ? 'top-0 left-0 right-0 h-[calc(3rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]'
                        : 'top-[calc(env(safe-area-inset-top)+8px)] left-2 right-2 h-14 pt-0'
                    }
                `}
            >

                <div
                    className={`absolute inset-0 -z-10 bg-black/40 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-300
                    ${isAtTop ? 'opacity-0 rounded-none' : 'opacity-100 rounded-[1.75rem]'} ${isMenuOpen ? 'rounded-br-sm' : ''}
                    `}
                />

                <div className="font-bold text-lg text-body tracking-wide flex items-center gap-1">
                    <FilmStripIcon size={32} weight="light"/>
                    HomeReel
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-1 rounded-full text-muted active:bg-white/10 transition-colors`}
                    >
                        <DotsThreeVerticalIcon size={28} weight="bold" />
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-60 bg-transparent" onClick={() => setIsMenuOpen(false)}/>

                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed top-[calc(env(safe-area-inset-top)+4rem-1px)] z-70 right-2 w-48 rounded-sm backdrop-blur-xl bg-black/80 border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                        >
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

                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                }}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                            >
                                <ArrowsClockwiseIcon size={20} />
                                Sync
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed bottom-1 left-1 right-1 h-14 m-1 rounded-full backdrop-blur-md grid grid-cols-4 z-50 overflow-hidden border border-white/10"
            >
                {navButtons.map((elem, index) => (
                    <NavbarButton
                        key={elem.label}
                        label={elem.label}
                        Icon={elem.Icon}
                        routingPath={elem.routingPath}
                        isActive={index === activeIndex}
                    />
                ))}
            </motion.div>
        </>
    )
}