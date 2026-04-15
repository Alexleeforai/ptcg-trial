'use client';

import { useRouter } from '@/lib/navigation';
import Card from '@/components/ui/Card';
import styles from './CollectionCard.module.css';
import { getHighQualityImage } from '@/lib/imageUtils';
import Link from 'next/link';
import { snkrdunkToHkd } from '@/lib/currency';

export default function CollectionCard({
    cardId,
    name,
    image,
    set,
    priceJpy,
    snkrdunkProductId,
    snkrdunkPricePSA10,
    snkrdunkPriceUsd,
    snkrdunkPricePSA10Usd,
    currency,
    rate,
    initialPurchasePrice,
    items = [],
    cardType
}) {
    // Only use SNKRDUNK price — show 未配對 if not matched
    const hasSnkPrice = snkrdunkProductId > 0 && currency !== 'USD' && priceJpy > 0;
    const currentPriceHkd = hasSnkPrice ? snkrdunkToHkd(snkrdunkPriceUsd, priceJpy, rate) : 0;

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

    // Market price per grade — SNKRDUNK only; PSA prices from snkrdunkPricePSA10/9
    const marketByGrade = {
        RAW:    currentPriceHkd,
        PSA10:  hasSnkPrice && snkrdunkPricePSA10 > 0 ? snkrdunkToHkd(snkrdunkPricePSA10Usd, snkrdunkPricePSA10, rate) : 0,
        GRADE9: 0,
    };

    // Group items by grade, compute avg cost + P/L% per grade
    const gradeGroups = {};
    displayItems.forEach(item => {
        const g = item.grade || 'RAW';
        if (!gradeGroups[g]) gradeGroups[g] = { items: [], label: g };
        gradeGroups[g].items.push(item);
    });

    const gradeOrder = ['RAW', 'PSA10', 'GRADE9'];
    const gradeLabel  = { RAW: 'Raw', PSA10: 'PSA 10', GRADE9: 'Grade 9' };

    const gradeSummaries = gradeOrder
        .filter(g => gradeGroups[g])
        .map(g => {
            const gItems   = gradeGroups[g].items;
            const count    = gItems.length;
            const total    = gItems.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
            const avg      = count > 0 ? Math.round(total / count) : 0;
            const market   = marketByGrade[g] || 0;
            const plPct    = avg > 0 && market > 0
                ? ((market - avg) / avg) * 100
                : null;
            return { g, label: gradeLabel[g], count, total, avg, market, plPct };
        });

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
                <div className={styles.setRow}>
                    <p className={styles.cardSet}>{set}</p>
                    {cardType && <span className={styles.typeBadge}>{cardType}</span>}
                </div>
            </Link>

            <div className={styles.cardInfo}>
                <div className={styles.marketPrice}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <div>
                            <span className={styles.label}>Market Price (Raw)</span>
                            <div className={styles.priceDisplay} style={!hasSnkPrice ? { color: '#555', fontSize: '0.85em' } : {}}>
                                {hasSnkPrice ? `HK$${currentPriceHkd.toLocaleString()}` : '未配對'}
                            </div>
                        </div>
                        {hasSnkPrice && marketByGrade.PSA10 > 0 && (
                            <div style={{ textAlign: 'right' }}>
                                <span className={styles.label}>PSA 10</span>
                                <div className={styles.priceDisplay} style={{ color: '#888', fontSize: '0.9rem' }}>
                                    HK${marketByGrade.PSA10.toLocaleString()}
                                </div>
                            </div>
                        )}
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
                            {/* Per-grade breakdown */}
                            {gradeSummaries.map(({ g, label, count, total, avg, market, plPct }) => (
                                <div key={g} className={styles.gradeBlock}>
                                    <div className={styles.gradeHeader}>
                                        <span className={styles.gradeName}>{label}</span>
                                        <span className={styles.gradeCount}>{count} owned</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span className={styles.label}>Avg Cost</span>
                                        <span className={styles.value}>HK${avg.toLocaleString()}</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span className={styles.label}>Total Cost</span>
                                        <span className={styles.value}>HK${total.toLocaleString()}</span>
                                    </div>
                                    {plPct !== null && (
                                        <div className={styles.summaryRow}>
                                            <span className={styles.label}>vs Market</span>
                                            <span className={`${styles.plBadge} ${plPct >= 0 ? styles.plGain : styles.plLoss}`}>
                                                {plPct >= 0 ? '▲' : '▼'} {Math.abs(plPct).toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
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
