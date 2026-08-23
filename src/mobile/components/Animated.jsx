import React, { useState, forwardRef, useImperativeHandle } from 'react';

export const Animated = forwardRef(({ children, className = '' }, ref) => {
    const [renderKey, setRenderKey] = useState(0);

    useImperativeHandle(ref, () => ({
        play: () => {
            setRenderKey(prev => (prev + 1) % 1000);
        }
    }));

    if (!renderKey) return null;

    // Use a unique key to force remounting the DOM elements, which restarts the CSS animation
    return (
        <div key={renderKey} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
            {children}
        </div>
    );
});
