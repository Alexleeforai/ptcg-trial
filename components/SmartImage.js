'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

const PLACEHOLDER = '/images/no-image-available.svg';

// PriceCharting image fallback chain — try best available resolution
const FALLBACKS = (url) => {
    if (!url) return [];

    // PriceCharting URLs have a resolution suffix: /60.jpg /240.jpg /1600.jpg etc.
    const pattern = /\/(60|240|1200|1600|original)\.(jpg|png)/;
    const match = url.match(pattern);

    if (!match) return [url];
    const ext = match[2];

    // Try best quality first, fall back progressively
    return [
        url.replace(pattern, `/1600.${ext}`),
        url.replace(pattern, `/240.${ext}`),
        url.replace(pattern, `/60.${ext}`),
    ];
};

function initFromSrc(src) {
    if (!src || src === '/images/no-image-available.png') return { imgSrc: PLACEHOLDER, variants: [] };
    const possibleUrls = FALLBACKS(src);
    return { imgSrc: possibleUrls[0] || src, variants: possibleUrls };
}

export default function SmartImage({ src, alt, ...props }) {
    const [imgSrc, setImgSrc] = useState(() => initFromSrc(src).imgSrc);
    const [attempts, setAttempts] = useState(0);
    const [variants, setVariants] = useState(() => initFromSrc(src).variants);

    useEffect(() => {
        const init = initFromSrc(src);
        setVariants(init.variants);
        setImgSrc(init.imgSrc);
        setAttempts(0);
    }, [src]);

    const handleError = () => {
        const nextAttempt = attempts + 1;
        if (nextAttempt < variants.length) {
            setAttempts(nextAttempt);
            setImgSrc(variants[nextAttempt]);
        } else {
            setImgSrc(PLACEHOLDER);
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
