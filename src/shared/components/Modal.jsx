import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';
import { XIcon } from '@phosphor-icons/react';

export function Modal({ isOpen, onClose, title, children, className = "max-w-lg", hideHeader = false, unstyledBody = false }) {
    const [mounted, setMounted] = useState(false);
    const modalRef = useRef(null);
    const isPresent = useIsPresent();

    useEffect(() => {
        if (!isPresent && modalRef.current) {
            modalRef.current.style.transition = 'opacity 0.3s ease-out';
            requestAnimationFrame(() => {
                if (modalRef.current) {
                    modalRef.current.style.opacity = '0';
                    modalRef.current.style.pointerEvents = 'none';
                }
            });
        }
    }, [isPresent]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        const handlePopState = () => {
            if (isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('popstate', handlePopState);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isOpen, onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div ref={modalRef} className="fixed inset-0 z-9999 flex items-center justify-center noselect">
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
                        className={`relative w-full ${className} max-h-[90vh] bg-surface/90 border border-divider rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto`}
                    >
                        {/* Header */}
                        {!hideHeader && (
                            <div className="flex items-center justify-between p-4 border-b border-divider shrink-0">
                                <h2 className="text-xl font-semibold text-body tracking-wide">{title}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full text-muted hover:text-body hover:bg-divider transition-colors cursor-pointer"
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
        </AnimatePresence>,
        document.body
    );
}
