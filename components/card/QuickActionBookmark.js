'use client';

import { useAuth } from '@clerk/nextjs';
import { useCollection } from '@/components/providers/CollectionProvider';
import styles from './QuickActionBookmark.module.css';

export default function QuickActionBookmark({ cardId }) {
    const { isSignedIn } = useAuth();
    const { collectionIds, addToCollection, removeFromCollection } = useCollection();

    // Don't render server-side mismatch, waiting for auth is ok
    if (!isSignedIn) return null;

    const isAdded = collectionIds.has(cardId);

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
