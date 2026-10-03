import React from 'react';

const RingGlow = ({
    rounded = 'rounded-lg',
    hover = false,
    includeSolid = false,
    intensity = '70',
    solidIntensity = '8',
    className = '',
}) => {
    const baseClasses = `absolute inset-0 pointer-events-none ${rounded}`;
    const glowClasses = `${baseClasses} ring-1 ring-inset ring-white/${intensity} mix-blend-soft-light animate-fade-in-glow`;
    const solidClasses = `${baseClasses} ring-1 ring-inset ring-white/${solidIntensity}`;
    const hoverClasses = hover ? 'transition-shadow group-hover:ring-4' : '';

    return (
        <>
            <div className={`${glowClasses} ${hoverClasses} ${className}`.trim()} />
            {includeSolid && (
                <div className={`${solidClasses} ${hoverClasses}`.trim()} />
            )}
        </>
    );
};

export default RingGlow;
