'use client';

import { useState, useEffect } from 'react';
// We need a way to navigate to card detail, using shared Link or standard a tag
// Assuming we can use standard a tag for simplicity or pass a Link component if needed
import Link from 'next/link';
import styles from './RecentlyViewed.module.css';

export default function RecentlyViewed() {
    const [cards, setCards] = useState([]);

    useEffect(() => {
        // Load from local storage
        try {
            const stored = localStorage.getItem('ptcg_recently_viewed');
            if (stored) {
                setCards(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }, []);

    if (cards.length === 0) return null;

    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>Recently Viewed</h2>
                <button
                    className={styles.clearBtn}
                    onClick={() => {
                        localStorage.removeItem('ptcg_recently_viewed');
                        setCards([]);
                    }}
                >
                    Clear
                </button>
            </div>
            <div className={styles.grid}>
                {cards.map(card => (
                    <a key={card.id} href={`/search?q=${card.name}`} className={styles.cardItem}
                        // Ideally this links to /card/[id], but we need to handle locale if we use raw <a>
                        // For now, let's assume we link to the detail page. 
                        // Since this is a client component, we might not know the current locale easily without hooks.
                        // Let's rely on the fact that when saving, we store the full link or construct it.
                        // Actually, better to just store ID and construct link if possible, or store the Path.
                        // Let's try to store the path when saving.
                        onClick={(e) => {
                            e.preventDefault();
                            window.location.href = card.path || `/card/${card.id}`;
                        }}
                    >
                        <div className={styles.imageWrapper}>
                            <img src={card.image} alt={card.name} className={styles.cardImage} />
                        </div>
                        <div className={styles.cardInfo}>
                            <div className={styles.cardName}>{card.name}</div>
                            <div className={styles.cardPrice}>¥{card.basePriceJPY?.toLocaleString()}</div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
