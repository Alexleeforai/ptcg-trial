'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
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
                    const originalPrice = card.price || 0;
                    const cardCurrency = card.currency || 'JPY';

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
                                    <Image
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
                                        <span className={styles.originalPrice}>({card.currency === 'JPY' ? '¥' : '$'}{originalPrice.toLocaleString()})</span>
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
