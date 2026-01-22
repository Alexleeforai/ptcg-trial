'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import styles from './BookmarkButton.module.css';

export default function BookmarkButton({ cardId, initialBookmarked = false }) {
    const { isSignedIn } = useAuth();
    const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
    const [isLoading, setIsLoading] = useState(false);

    if (!isSignedIn) {
        return null; // Don't show button if not signed in
    }

    const handleToggle = async () => {
        setIsLoading(true);

        try {
            const endpoint = isBookmarked ? '/api/collection/remove' : '/api/collection/add';
            const method = isBookmarked ? 'DELETE' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cardId }),
            });

            if (response.ok) {
                setIsBookmarked(!isBookmarked);
            } else {
                console.error('Failed to toggle bookmark');
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`${styles.bookmarkButton} ${isBookmarked ? styles.bookmarked : ''}`}
            aria-label={isBookmarked ? 'Remove from collection' : 'Add to collection'}
        >
            <span className={styles.icon}>
                {isBookmarked ? '❤️' : '🤍'}
            </span>
            <span className={styles.text}>
                {isBookmarked ? 'In Collection' : 'Add to Collection'}
            </span>
        </button>
    );
}
