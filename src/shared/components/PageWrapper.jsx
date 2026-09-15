import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { isMobile } from '../utils/PlatformUtils';

export function PageWrapper({ children, transparent = false, edgeToEdge = false, useDefaultTransition = true, saveScroll = true, depth = 0 }) {
    const location = useLocation();
    const scrollRef = useRef(null);
    const isRestoring = useRef(true);

    const scrollKey = `scrollPos:${location.pathname}`;

    useEffect(() => {
        if (!saveScroll) {
            isRestoring.current = false;
            return;
        }

        const savedScroll = sessionStorage.getItem(scrollKey);

        if (savedScroll && scrollRef.current) {
            scrollRef.current.scrollTop = parseInt(savedScroll, 10);

            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = parseInt(savedScroll, 10);
                }
                isRestoring.current = false;
            }, 100);
        } else {
            isRestoring.current = false;
        }
    }, [scrollKey, saveScroll]);

    const handleScroll = (e) => {
        const scrollTop = e.currentTarget.scrollTop;

        window.dispatchEvent(new CustomEvent('page-scroll', { detail: { scrollTop } }));

        if (saveScroll && !isRestoring.current) {
            sessionStorage.setItem(scrollKey, scrollTop.toString());
        }
    };

    const containerClassName = `absolute inset-0 w-full h-full overflow-hidden overflow-y-auto ${transparent ? 'bg-transparent' : 'bg-background'} ${!edgeToEdge ? 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]' : ''}`;

    if (useDefaultTransition) {
        const animationProps = isMobile
            ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
            : { initial: { opacity: 0, scale: 1.02 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.02 } };

        return (
            <motion.div
                ref={scrollRef}
                {...animationProps}
                transition={{ duration: isMobile ? 0.3 : 0.5, ease: "easeInOut" }}
                onScroll={handleScroll}
                className={containerClassName}
                style={{ zIndex: depth * 100 }}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <div ref={scrollRef} onScroll={handleScroll} className={containerClassName} style={{ zIndex: depth * 100 }}>
            {children}
        </div>
    );
}
