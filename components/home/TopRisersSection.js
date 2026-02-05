'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';
import QuickActionBookmark from '@/components/card/QuickActionBookmark';
import { Link } from '@/lib/navigation';
import { getHighQualityImage } from '@/lib/imageUtils';
import styles from './TopRisersSection.module.css';

import { useCurrency } from '@/hooks/useCurrency';
import { convertPrice, formatPrice } from '@/lib/currency';

export default function TopRisersSection({ cards }) {
    const currency = useCurrency();

    if (!cards || cards.length === 0) return null;

    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>📈 Top Risers</h2>
            </div>
            <div className={styles.grid}>
                {cards.map((card, index) => {
                    // Support both formats: priceRaw (USD) or price (JPY)
                    let originalPrice = 0;
                    let cardCurrency = 'JPY';

                    if (card.priceRaw && card.currency === 'USD') {
                        // PriceCharting data
                        originalPrice = card.priceRaw;
                        cardCurrency = 'USD';
                    } else if (card.price) {
                        // SNKRDUNK data
                        originalPrice = card.price;
                        cardCurrency = card.currency || 'JPY';
                    }

                    const displayPrice = convertPrice(originalPrice, cardCurrency, currency);
                    const formattedPrice = formatPrice(displayPrice, currency);

                    // Convert rise amount too
                    const riseAmount = card.riseAmount || 0;
                    const displayRise = convertPrice(riseAmount, cardCurrency, currency);
                    const formattedRise = formatPrice(displayRise, currency);

                    return (
                        <div key={card.id} className={styles.card} style={{ position: 'relative', display: 'block', padding: 0 }}>
                            <QuickActionBookmark cardId={card.id} />
                            <Link href={`/card/${card.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div className={styles.badge}>+{card.risePercent}%</div>
                                <div className={styles.imageWrapper}>
                                    {card.image ? (
                                        <SmartImage
                                            src={card.image}
                                            alt={card.name}
                                            fill
                                            sizes="(max-width: 768px) 33vw, 20vw"
                                            style={{ objectFit: 'contain' }}
                                            className={styles.image}
                                        />
                                    ) : (
                                        <div className={styles.noImage}>No Image</div>
                                    )}
                                </div>
                                <div className={styles.info}>
                                    <div className={styles.name}>{card.name}</div>
                                    <div className={styles.priceData}>
                                        <div className={styles.priceColumn}>
                                            <span className={styles.price}>{formattedPrice}</span>
                                            {card.pricePSA10 && (
                                                <div style={{ fontSize: '0.7em', color: '#888', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    PSA 10: {formatPrice(
                                                        // Convert USD PSA10 (if USD) to HKD roughly or use currency hook properly
                                                        card.pricePSA10 * (currency === 'HKD' ? 7.8 : 1),
                                                        currency
                                                    ).split('.')[0]}
                                                </div>
                                            )}
                                        </div>
                                        <span className={styles.riseAmount}>
                                            +{formattedRise}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
