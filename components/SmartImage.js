'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

// PriceCharting image fallback chain
const FALLBACKS = (url) => {
    // Return empty if no url
    if (!url) return [];

    // Pattern to identify resolution part
    // Matches /60.jpg, /240.jpg, /1600.jpg etc.
    const pattern = /\/(60|240|1200|1600|original)\.(jpg|png)/;
    const match = url.match(pattern);

    if (!match) return [url];

    const base = url;
    const ext = match[2];

    // Priority order: 1600 -> 1200 -> original -> 240
    // We construct these variants replacing whatever current size is there
    return [
        base.replace(pattern, `/1600.${ext}`),
        base.replace(pattern, `/1200.${ext}`),
        base.replace(pattern, `/original.${ext}`),
        base.replace(pattern, `/240.${ext}`)
    ];
};

export default function SmartImage({ src, alt, ...props }) {
    const [imgSrc, setImgSrc] = useState(src);
    const [attempts, setAttempts] = useState(0);
    const [variants, setVariants] = useState([]);

    useEffect(() => {
        if (!src) {
            setImgSrc('/images/no-image-available.png');
            return;
        }
        // When initial src changes, reset everything
        // But first, we want the "Best" initial guess
        const possibleUrls = FALLBACKS(src);
        setVariants(possibleUrls);
        setImgSrc(possibleUrls[0] || src);
        setAttempts(0);
    }, [src]);

    const handleError = () => {
        const nextAttempt = attempts + 1;
        if (nextAttempt < variants.length) {
            setAttempts(nextAttempt);
            setImgSrc(variants[nextAttempt]);
        } else {
            // All failed - fallback to placeholder
            setImgSrc('/images/no-image-available.png');
        }
    };

    // Prevent rendering NextImage with empty src
    if (!imgSrc) return null;

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt || 'Card Image'}
            onError={handleError}
        />
    );
}
