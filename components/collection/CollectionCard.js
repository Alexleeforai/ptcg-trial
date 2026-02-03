'use client';

import { useRouter } from '@/lib/navigation';
import Card from '@/components/ui/Card';
import styles from './CollectionCard.module.css';
import { getHighQualityImage } from '@/lib/imageUtils';
import Link from 'next/link';

export default function CollectionCard({
    cardId,
    name,
    image,
    set,
    priceJpy,
    priceRawUsd,
    currency,
    rate,
    initialPurchasePrice,
    items = []
}) {
    // Calculate current market price reference (HKD)
    let currentPriceHkd = 0;
    if (priceRawUsd && currency === 'USD') {
        currentPriceHkd = Math.round(priceRawUsd * 7.8);
    } else {
        currentPriceHkd = Math.round((priceJpy || 0) * rate);
    }

    // Determine copies data
    // Fallback to legacy purchasePrice if items is empty but price exists
    let displayItems = items;
    if ((!items || items.length === 0) && initialPurchasePrice > 0) {
        displayItems = [{ id: 'legacy', price: initialPurchasePrice, grade: 'RAW' }];
    }

    const copyCount = displayItems.length;

    // Calculate total P/L context
    // Ideally we need specific market prices for grades to be accurate here across all copies.
    // But in the grid, we might just show "3 Copies" and maybe a simple "Avg Cost"?
    // Or just "Manage" button.

    const totalCost = displayItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const avgCost = copyCount > 0 ? Math.round(totalCost / copyCount) : 0;

    return (
        <Card className={styles.cardContainer} hover>
            <Link href={`/card/${cardId}`} style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }}>
                <div className={styles.imageWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={getHighQualityImage(image)}
                        alt={name}
                        className={styles.cardImage}
                    />
                    {copyCount > 1 && (
                        <span className={styles.badge}>{copyCount} Copies</span>
                    )}
                </div>
                <h3 className={styles.cardName}>{name}</h3>
                <p className={styles.cardSet}>{set}</p>
            </Link>

            <div className={styles.cardInfo}>
                <div className={styles.marketPrice}>
                    <span className={styles.label}>Market Price (Raw)</span>
                    <div className={styles.priceDisplay}>
                        HK${currentPriceHkd.toLocaleString()}
                    </div>
                </div>

                <div className={styles.purchaseSection}>
                    {copyCount === 0 ? (
                        <div className={styles.emptyState}>
                            <span>No price tracked</span>
                            <Link href={`/card/${cardId}`} className={styles.manageLink}>+ Add</Link>
                        </div>
                    ) : (
                        <div className={styles.summaryState}>
                            <div className={styles.summaryRow}>
                                <span className={styles.label}>Owned</span>
                                <span className={styles.value}>{copyCount}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.label}>Total Cost</span>
                                <span className={styles.value}>HK${totalCost.toLocaleString()}</span>
                            </div>
                            <Link href={`/card/${cardId}`} className={styles.manageBtn}>
                                Manage Collection
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
