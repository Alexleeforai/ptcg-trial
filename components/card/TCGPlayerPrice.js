'use client';

import { useState } from 'react';
import { getTCGPlayerPrices } from '@/lib/tcgplayer-server';
import styles from './TCGPlayerPrice.module.css';

export default function TCGPlayerPrice({ cardName, setName, cardNumber }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Extract the numeric part of the card number (e.g. "134" from "134/108") 
    // to match against TCGPlayer titles which might be "134/108" or "134"
    const targetNumber = cardNumber ? cardNumber.split('/')[0] : '';

    const fetchPrice = async () => {
        setLoading(true);
        setError(null);
        try {
            // Search mainly by name + set to get a broad enough list
            // We will filter by number locally
            const query = `${cardName} ${setName || ''}`.trim();
            const results = await getTCGPlayerPrices(query);

            if (!results || results.length === 0) {
                setData([]);
                return;
            }

            // Client-side Ranking Strategy
            let displayResults = results;

            // If we have a target number, strictly filter for it first
            if (targetNumber) {
                const exactMatches = results.filter(item => item.name.includes(targetNumber));
                if (exactMatches.length > 0) {
                    displayResults = exactMatches;
                }
            }

            // Still sort by relevance/score
            const ranked = displayResults.map(item => {
                let score = 0;
                // Bonus for matching number
                if (targetNumber && item.name.includes(targetNumber)) {
                    score += 10;
                }
                // Bonus for matching set name exactly
                if (setName && item.set.toLowerCase().includes(setName.toLowerCase())) {
                    score += 5;
                }
                return { ...item, score };
            }).sort((a, b) => b.score - a.score);

            setData(ranked);
        } catch (err) {
            setError('Failed to load');
        } finally {
            setLoading(false);
        }
    };

    // Helper to convert price string
    const convertToHKD = (priceStr) => {
        if (!priceStr || priceStr === 'N/A') return null;
        const clean = priceStr.replace(/[$,]/g, '');
        const usd = parseFloat(clean);
        if (isNaN(usd)) return null;
        // Approx rate 7.8
        return Math.round(usd * 7.8);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.logo}>TCGPlayer Market (Raw NM)</span>
                <button onClick={fetchPrice} className={styles.refreshBtn} disabled={loading}>
                    {loading ? 'Loading...' : (data ? 'Refresh' : 'Check Price')}
                </button>
            </div>

            {error && <span className={styles.error}>{error}</span>}

            {data && data.length > 0 && (
                <div className={styles.resultsList}>
                    {data.slice(0, 5).map((item, idx) => {
                        const isMatch = targetNumber && item.name.includes(targetNumber);
                        const hkdPrice = convertToHKD(item.price);

                        return (
                            <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer"
                                className={`${styles.resultItem} ${isMatch ? styles.highlight : ''}`}>
                                <div className={styles.itemMain}>
                                    <div className={styles.priceRow}>
                                        <span className={styles.price}>{item.price}</span>
                                        {hkdPrice && <span className={styles.convertedPrice}>≈ HK${hkdPrice}</span>}
                                    </div>
                                    {isMatch && <span className={styles.matchBadge}>MATCH</span>}
                                </div>
                                <div className={styles.itemName}>{item.name}</div>
                                <div className={styles.itemMeta}>{item.set}</div>
                            </a>
                        );
                    })}
                </div>
            )}

            {data && data.length === 0 && (
                <div className={styles.notFound}>No listings found</div>
            )}

            <div className={styles.footerNote}>
                *Prices are for Raw / Near Mint condition.
            </div>
        </div>
    );
}
