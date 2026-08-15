import { motion } from 'framer-motion';

export function PageWrapper({ children, transparent = false }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`absolute inset-0 w-full h-full overflow-hidden ${transparent ? 'bg-transparent' : 'bg-background'}`}
        >
            {children}
        </motion.div>
    );
}