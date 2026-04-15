'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/navigation';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';
import QuickActionBookmark from '@/components/card/QuickActionBookmark';
import { getHighQualityImage } from '@/lib/imageUtils';
import styles from './RecentlyViewed.module.css';
import { snkrdunkToHkd } from '@/lib/currency';

export default function RecentlyViewed({ rate = 0.052 }) {
    const [cards, setCards] = useState([]);
    const router = useRouter();

    useEffect(() => {
        async function load() {
            try {
                const stored = localStorage.getItem('ptcg_recently_viewed');
                if (!stored) return;
                let history = JSON.parse(stored);

                // Find stale entries missing snkrdunkProductId or snkrdunkPriceUsd (new field)
                const staleIds = history
                    .filter(c => !('snkrdunkProductId' in c) || !('snkrdunkPriceUsd' in c))
                    .map(c => c.id);

                if (staleIds.length > 0) {
                    // Batch fetch fresh data for stale cards
                    const freshArr = await fetch(`/api/cards?ids=${staleIds.map(encodeURIComponent).join(',')}`)
                        .then(r => r.ok ? r.json() : [])
                        .catch(() => []);
                    const freshMap = {};
                    freshArr.forEach(f => { if (f?.id) freshMap[f.id] = f; });

                    history = history.map(c => {
                        const isStale = !('snkrdunkProductId' in c) || !('snkrdunkPriceUsd' in c);
                        if (isStale && freshMap[c.id]) {
                            const f = freshMap[c.id];
                            return {
                                ...c,
                                price: f.price || c.price,
                                currency: f.currency || c.currency,
                                snkrdunkProductId: f.snkrdunkProductId ?? null,
                                snkrdunkPricePSA10: f.snkrdunkPricePSA10 ?? null,
                                snkrdunkPriceUsd: f.snkrdunkPriceUsd ?? null,
                                snkrdunkPricePSA10Usd: f.snkrdunkPricePSA10Usd ?? null,
                            };
                        }
                        // Mark as resolved even if not found, to avoid re-fetching every render
                        if (isStale) {
                            return { ...c, snkrdunkProductId: c.snkrdunkProductId ?? null, snkrdunkPriceUsd: null };
                        }
                        return c;
                    });

                    // Persist updated entries
                    localStorage.setItem('ptcg_recently_viewed', JSON.stringify(history));
                }

                setCards(history);
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
        load();
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
                    const hasPrice = card.snkrdunkProductId > 0 && card.currency !== 'USD' && card.price > 0;
                    const hkdPrice = hasPrice ? snkrdunkToHkd(card.snkrdunkPriceUsd, card.price, rate) : 0;
                    const psa10Hkd = hasPrice && card.snkrdunkPricePSA10 > 0
                        ? snkrdunkToHkd(card.snkrdunkPricePSA10Usd, card.snkrdunkPricePSA10, rate) : 0;

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
                                <div className={styles.cardPrice} style={!hasPrice ? { color: '#555', fontSize: '0.85em' } : {}}>
                                    {hasPrice ? `HK$${hkdPrice.toLocaleString()}` : '未配對'}
                                    {psa10Hkd > 0 && (
                                        <div style={{ fontSize: '0.75em', color: '#666', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            PSA 10: HK${psa10Hkd.toLocaleString()}
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
