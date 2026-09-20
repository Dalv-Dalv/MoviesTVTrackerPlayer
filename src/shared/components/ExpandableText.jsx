import { useState, useRef, useEffect } from 'react';

export function ExpandableText({ 
    text, 
    className = '', 
    lineClampClass = 'line-clamp-3', 
    showLessText = 'Show less', 
    showLessClassName = 'ml-2 text-muted hover:text-body text-sm font-normal cursor-pointer transition-colors whitespace-nowrap'
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        if (textRef.current) {
            setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
        }
    }, [text]);

    return (
        <p
            ref={textRef}
            onClick={() => { if (!isExpanded && isTruncated) setIsExpanded(true) }}
            className={`${className} ${!isExpanded ? lineClampClass : ''} ${!isExpanded && isTruncated ? 'cursor-pointer' : ''}`}
        >
            {text}
            {isExpanded && isTruncated && (
                <span
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                    className={showLessClassName}
                >
                    {showLessText}
                </span>
            )}
        </p>
    );
}
