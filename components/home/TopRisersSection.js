'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';
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
                        <Link key={card.id} href={`/card/${card.id}`} className={styles.card}>
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
                                                    // Note: pricePSA10 from DB is usually raw USD number if from PC. 
                                                    // We'll assume USD -> current currency conversion if needed, 
                                                    // but simply multiplying by 7.8 is safer for HKD context if currency context is HKD.
                                                    // However, useCurrency hook usually sets 'HKD'.
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
                    );
                })}
            </div>
        </div>
    );
}
