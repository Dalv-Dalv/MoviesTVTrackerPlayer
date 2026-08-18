import { motion } from 'framer-motion';

export function PageWrapper({ children, transparent = false }) {
    const handleScroll = (e) => {
        const scrollTop = e.currentTarget.scrollTop;
        window.dispatchEvent(new CustomEvent('page-scroll', { detail: { scrollTop } }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onScroll={handleScroll}
            className={`absolute inset-0 w-full h-full overflow-hidden overflow-y-auto ${transparent ? 'bg-transparent' : 'bg-background'}`}
        >
            {children}
        </motion.div>
    );
}