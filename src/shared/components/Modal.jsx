import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from '@phosphor-icons/react';

export function Modal({ isOpen, onClose, title, children, className = "max-w-lg", hideHeader = false, unstyledBody = false }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 noselect">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                            type: "tween",
                            ease: [0.5, 0, 0, 1],
                            duration: 0.3
                        }}
                        className={`relative w-full ${className} max-h-[90vh] bg-surface/90 backdrop-blur-lg border border-divider rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto`}
                    >
                        {/* Header */}
                        {!hideHeader && (
                            <div className="flex items-center justify-between p-4 border-b border-divider shrink-0">
                                <h2 className="text-xl font-semibold text-body tracking-wide">{title}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full text-muted hover:text-body hover:bg-divider transition-colors"
                                >
                                    <XIcon size={20} weight="bold" />
                                </button>
                            </div>
                        )}

                        {/* Body */}
                        <div className={unstyledBody ? "flex-1 overflow-hidden flex flex-col" : "p-2 sm:p-4 text-body overflow-y-auto"}>
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
