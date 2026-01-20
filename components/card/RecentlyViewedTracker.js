'use client';

import { useEffect } from 'react';

export default function RecentlyViewedTracker({ card }) {
    useEffect(() => {
        if (!card) return;

        try {
            const stored = localStorage.getItem('ptcg_recently_viewed');
            let history = stored ? JSON.parse(stored) : [];

            // Remove existing entry for this card to prevent duplicates and move to top
            history = history.filter(c => c.id !== card.id);

            // Add tracked card to beginning
            const trackedCard = {
                id: card.id,
                name: card.name,
                image: card.image,
                basePriceJPY: card.basePriceJPY,
                path: window.location.pathname // Save the current localized path
            };

            history.unshift(trackedCard);

            // Limit to last 10 viewed
            if (history.length > 10) {
                history = history.slice(0, 10);
            }

            localStorage.setItem('ptcg_recently_viewed', JSON.stringify(history));
        } catch (e) {
            console.error("Failed to update recently viewed", e);
        }
    }, [card]);

    return null; // This component renders nothing
}
