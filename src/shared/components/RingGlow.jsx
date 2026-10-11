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

    const intensityMap = {
        '10': 'ring-white/10', '20': 'ring-white/20', '30': 'ring-white/30',
        '40': 'ring-white/40', '50': 'ring-white/50', '60': 'ring-white/60',
        '70': 'ring-white/70', '80': 'ring-white/80', '90': 'ring-white/90',
        '100': 'ring-white/100', '8': 'ring-white/8'
    };

    const glowColorClass = intensityMap[intensity] || `ring-white/${intensity}`;
    const solidColorClass = intensityMap[solidIntensity] || `ring-white/${solidIntensity}`;

    const glowClasses = `${baseClasses} ring-1 ring-inset ${glowColorClass} mix-blend-soft-light`;
    const solidClasses = `${baseClasses} ring-1 ring-inset ${solidColorClass}`;
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
