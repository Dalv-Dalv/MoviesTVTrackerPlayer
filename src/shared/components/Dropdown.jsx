import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { isMobile } from '../utils/PlatformUtils';

export function Dropdown({ Trigger, children, dropdownClassName = '', usePortal = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

    const updateCoords = () => {
        if (triggerRef.current) {
            setCoords(triggerRef.current.getBoundingClientRect());
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                triggerRef.current && !triggerRef.current.contains(event.target)) {
                
                if (isMobile) {
                    event.stopPropagation();
                    event.preventDefault();
                }
                
                setIsOpen(false);
            }
        };

        if (isMobile) {
            // Using click on mobile ensures it only triggers on a tap and not a scroll
            document.addEventListener('click', handleClickOutside, { capture: true });
        } else {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        const handleCloseAll = () => setIsOpen(false);
        window.addEventListener('closeAllDropdowns', handleCloseAll);
        
        return () => {
            if (isMobile) {
                document.removeEventListener('click', handleClickOutside, { capture: true });
            } else {
                document.removeEventListener('mousedown', handleClickOutside);
            }
            window.removeEventListener('closeAllDropdowns', handleCloseAll);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && usePortal) {
            updateCoords();
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
            return () => {
                window.removeEventListener('resize', updateCoords);
                window.removeEventListener('scroll', updateCoords, true);
            };
        }
    }, [isOpen, usePortal]);

    const portalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{
                        type: "tween",
                        ease: [0.5, 0, 0, 1],
                        duration: 0.3
                    }}
                    style={usePortal ? {
                        position: 'fixed',
                        top: coords.bottom + 8,
                        right: window.innerWidth - coords.right,
                    } : undefined}
                    className={`${usePortal ? 'z-[100]' : 'absolute z-40'} bg-black/50 text-body text-base flex flex-col items-stretch p-2 rounded-2xl backdrop-blur-md pointer-events-auto shadow-2xl shadow-black/80 ring-1 ring-white/10 ${dropdownClassName}`}
                >
                    {typeof children === 'function' ? children({ close: () => setIsOpen(false) }) : children}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div ref={triggerRef} className="relative flex">
            <Trigger isOpen={isOpen} toggle={() => setIsOpen(!isOpen)} />

            {usePortal ? createPortal(portalContent, document.body) : portalContent}
        </div>
    );
}
