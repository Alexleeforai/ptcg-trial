'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import styles from './QuickActionBookmark.module.css';

export default function QuickActionBookmark({ cardId }) {
    const { isSignedIn } = useAuth();
    const [isAdded, setIsAdded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!isSignedIn) return null;

    const handleAdd = async (e) => {
        e.preventDefault(); // Stop link navigation
        e.stopPropagation(); // Stop bubbling

        if (isLoading) return;

        setIsLoading(true);

        try {
            // Default to ADD (POST)
            // If already added, backend handles it gracefully
            const response = await fetch('/api/collection/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cardId }),
            });

            if (response.ok) {
                setIsAdded(true);
            }
        } catch (error) {
            console.error('Error adding to collection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={`${styles.button} ${isAdded ? styles.added : ''}`}
            aria-label="Add to Collection"
            title="Add to Collection"
        >
            <span className={styles.icon}>
                {isAdded ? '❤️' : '🤍'}
            </span>
        </button>
    );
}
