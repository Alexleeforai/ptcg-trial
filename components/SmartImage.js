'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

const PLACEHOLDER = '/images/no-image-available.svg';

// PriceCharting image fallback chain — try best available resolution
const FALLBACKS = (url) => {
    if (!url) return [];

    const pattern = /\/(60|240|1200|1600|original)\.(jpg|png)/;
    const match = url.match(pattern);
    if (!match) return [url];
    const ext = match[2];

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

const isExternal = (url) => url?.startsWith('http');

export default function SmartImage({ src, alt, fill, width, height, style, className, sizes, priority }) {
    const [imgSrc, setImgSrc] = useState(() => initFromSrc(src).imgSrc);
    const variantsRef = useRef(initFromSrc(src).variants);
    const attemptsRef = useRef(0);

    useEffect(() => {
        const init = initFromSrc(src);
        variantsRef.current = init.variants;
        attemptsRef.current = 0;
        setImgSrc(init.imgSrc);
    }, [src]);

    const handleError = () => {
        const next = attemptsRef.current + 1;
        if (next < variantsRef.current.length) {
            attemptsRef.current = next;
            setImgSrc(variantsRef.current[next]);
        } else {
            setImgSrc(PLACEHOLDER);
        }
    };

    if (!imgSrc) return null;

    // External images: bypass Next.js image optimiser so onError fires reliably in browser
    if (isExternal(imgSrc)) {
        const imgStyle = fill
            ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
            : style;
        return (
            <img
                src={imgSrc}
                alt={alt || 'Card Image'}
                style={imgStyle}
                className={className}
                onError={handleError}
                loading={priority ? 'eager' : 'lazy'}
            />
        );
    }

    // Local images (placeholder SVG etc.): use next/image normally
    return (
        <Image
            src={imgSrc}
            alt={alt || 'Card Image'}
            fill={fill}
            width={!fill ? (width || 240) : undefined}
            height={!fill ? (height || 340) : undefined}
            style={style}
            className={className}
            sizes={sizes}
            priority={priority}
            onError={handleError}
        />
    );
}
