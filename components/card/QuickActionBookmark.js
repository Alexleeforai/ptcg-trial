'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useCollection } from '@/components/providers/CollectionProvider';
import styles from './QuickActionBookmark.module.css';

export default function QuickActionBookmark({ cardId }) {
    const { isLoaded, isSignedIn } = useAuth();
    const { collectionIds, addToCollection, removeFromCollection } = useCollection();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Prevent hydration mismatch by waiting for client mount and loaded auth state
    if (!mounted || !isLoaded || !isSignedIn) return null;

    const isAdded = collectionIds?.has(cardId) || false;

    const handleToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isAdded) {
            removeFromCollection(cardId);
        } else {
            addToCollection(cardId);
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={`${styles.button} ${isAdded ? styles.added : ''}`}
            aria-label={isAdded ? "Remove from Collection" : "Add to Collection"}
            title={isAdded ? "Remove from Collection" : "Add to Collection"}
        >
            <span className={styles.icon}>
                {isAdded ? '❤️' : '🤍'}
            </span>
        </button>
    );
}
