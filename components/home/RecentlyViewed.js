'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/navigation';
import styles from './RecentlyViewed.module.css';

export default function RecentlyViewed({ rate = 0.052 }) {
    const [cards, setCards] = useState([]);
    const router = useRouter();

    useEffect(() => {
        // ... (existing helper logic)
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
                {cards.map(card => {
                    const price = card.price || card.basePriceJPY || 0;
                    const hkdPrice = Math.round(price * rate);
                    return (
                        <div key={card.id} className={styles.cardItem}
                            onClick={() => router.push(`/card/${card.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.imageWrapper}>
                                <img src={card.image} alt={card.name} className={styles.cardImage} />
                            </div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardName}>{card.name}</div>
                                <div className={styles.cardPrice}>
                                    HK${hkdPrice.toLocaleString()}
                                    <span style={{ fontSize: '0.8em', color: '#888', marginLeft: '4px', fontWeight: 'normal' }}>
                                        (¥{price.toLocaleString()})
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
