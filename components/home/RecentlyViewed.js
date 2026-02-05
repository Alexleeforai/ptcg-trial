'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/navigation';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';
import QuickActionBookmark from '@/components/card/QuickActionBookmark';
import { getHighQualityImage } from '@/lib/imageUtils';
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
                    // Support both formats: priceRaw (USD) or price (JPY)
                    let hkdPrice = 0;
                    let jpyPrice = 0;

                    if (card.priceRaw && card.currency === 'USD') {
                        // PriceCharting data
                        hkdPrice = Math.round(card.priceRaw * 7.8);
                        jpyPrice = Math.round(card.priceRaw * 150);
                    } else {
                        // SNKRDUNK data
                        const price = card.price || card.basePriceJPY || 0;
                        hkdPrice = Math.round(price * rate);
                        jpyPrice = price;
                    }

                    return (
                        <div key={card.id} className={styles.cardItem}
                            onClick={() => router.push(`/card/${card.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <QuickActionBookmark cardId={card.id} />
                            <div className={styles.imageWrapper}>
                                {card.image ? (
                                    <SmartImage
                                        src={card.image}
                                        alt={card.name}
                                        className={styles.cardImage}
                                        fill
                                        sizes="(max-width: 768px) 33vw, 20vw"
                                        style={{ objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#1a1a1a',
                                        color: '#666',
                                        fontSize: '0.7rem'
                                    }}>
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardName}>{card.name}</div>
                                <div className={styles.cardPrice}>
                                    HK${hkdPrice.toLocaleString()}
                                    {card.pricePSA10 && (
                                        <div style={{ fontSize: '0.75em', color: '#666', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            PSA 10: ${Math.round(card.pricePSA10 * 7.8).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
