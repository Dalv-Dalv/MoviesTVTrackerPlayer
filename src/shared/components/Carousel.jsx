import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

export function Carousel({ children, className = "", id = "default-carousel" }) {
    const rowRef = useRef(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMaxScrolled, setIsMaxScrolled] = useState(false);
    const isRestoring = useRef(true);

    const handleScroll = () => {
        if (!rowRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;

        if (!isRestoring.current) {
            sessionStorage.setItem(`carousel-scroll-${id}`, scrollLeft);
        }

        setIsScrolled(scrollLeft > 0);
        setIsMaxScrolled(Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 1);
    };

    useEffect(() => {
        if (rowRef.current) {
            const savedScroll = sessionStorage.getItem(`carousel-scroll-${id}`);
            if (savedScroll) {
                rowRef.current.scrollLeft = parseInt(savedScroll, 10);
                setTimeout(() => {
                    if (rowRef.current) {
                        rowRef.current.scrollLeft = parseInt(savedScroll, 10);
                    }
                    isRestoring.current = false;
                }, 100);
            } else {
                isRestoring.current = false;
            }
        }
    }, [id]);

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [children]);

    const scroll = (direction) => {
        if (!rowRef.current) return;

        const container = rowRef.current;
        const { clientWidth, scrollLeft, scrollWidth } = container;
        const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;

        const maxScroll = scrollWidth - clientWidth;
        const targetScroll = Math.max(0, Math.min(scrollLeft + scrollAmount, maxScroll));
        const distance = targetScroll - scrollLeft;

        if (distance === 0) return;

        const duration = 1000;
        const startTime = performance.now();

        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

        const animateScroll = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            container.scrollLeft = scrollLeft + (distance * easeOutQuart(progress));

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    };

    const fadeWidth = "clamp(32px, 8%, 128px)";
    const maskStyle = {
        maskImage: `linear-gradient(to right, transparent, black ${fadeWidth}), linear-gradient(to left, transparent, black ${fadeWidth})`,
        WebkitMaskImage: `linear-gradient(to right, transparent, black ${fadeWidth}), linear-gradient(to left, transparent, black ${fadeWidth})`,
        maskSize: `calc(100% + ${fadeWidth}) 100%, calc(100% + ${fadeWidth}) 100%`,
        WebkitMaskSize: `calc(100% + ${fadeWidth}) 100%, calc(100% + ${fadeWidth}) 100%`,
        maskRepeat: 'no-repeat, no-repeat',
        WebkitMaskRepeat: 'no-repeat, no-repeat',
        maskPosition: `${isScrolled ? '0%' : '100%'} 0, ${!isMaxScrolled ? '100%' : '0%'} 0`,
        WebkitMaskPosition: `${isScrolled ? '0%' : '100%'} 0, ${!isMaxScrolled ? '100%' : '0%'} 0`,
        maskComposite: 'intersect',
        WebkitMaskComposite: 'source-in',
        transition: 'mask-position 0.3s ease, -webkit-mask-position 0.3s ease'
    };

    return (
        <div className={`relative flex items-center w-full ${className}`}>
            <div
                className={`absolute left-0 top-2 bottom-2 z-20 w-8 d:w-32 transition-opacity duration-300 flex items-center justify-start px-2 group/chevron ${isScrolled ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                onClick={() => scroll('left')}
            >
                <CaretLeftIcon size={40} className="text-white drop-shadow-md transition-all duration-300 opacity-0 group-hover/chevron:opacity-100 hover:scale-125" />
            </div>

            <div
                ref={rowRef}
                onScroll={handleScroll}
                className="flex flex-row gap-4 px-6 py-10 w-full overflow-x-auto noScrollbar scroll-px-6"
                style={maskStyle}
            >
                {children}
            </div>

            <div
                className={`absolute right-0 top-2 bottom-2 z-20 w-8 d:w-32 transition-opacity duration-300 flex items-center justify-end px-2 group/chevron ${!isMaxScrolled ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                onClick={() => scroll('right')}
            >
                <CaretRightIcon size={40} className="text-white drop-shadow-md transition-all duration-300 opacity-0 group-hover/chevron:opacity-100 hover:scale-125" />
            </div>
        </div>
    );
}
