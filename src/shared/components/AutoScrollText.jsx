import { useRef, useEffect, useState } from 'react';

export const AutoScrollText = ({ text, title, className = '' }) => {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() => {
        const checkScroll = () => {
            if (containerRef.current && textRef.current) {
                setShouldScroll(textRef.current.scrollWidth > containerRef.current.clientWidth);
            }
        };
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [text]);

    return (
        <div ref={containerRef} className={`overflow-hidden whitespace-nowrap w-full ${className}`} title={title}>
            <div 
                ref={textRef}
                className={`inline-block ${shouldScroll ? 'animate-auto-scroll' : ''}`}
                style={{
                    '--scroll-amount': shouldScroll ? `-${textRef.current.scrollWidth - containerRef.current.clientWidth}px` : '0px'
                }}
            >
                {text}
            </div>
        </div>
    );
};
