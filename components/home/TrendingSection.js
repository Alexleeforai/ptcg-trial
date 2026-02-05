'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';
import QuickActionBookmark from '@/components/card/QuickActionBookmark';
import { Link } from '@/lib/navigation';
import { getHighQualityImage } from '@/lib/imageUtils';
import styles from './TrendingSection.module.css';

import { useCurrency } from '@/hooks/useCurrency';
import { convertPrice, formatPrice } from '@/lib/currency';

export default function TrendingSection({ cards }) {
    const currency = useCurrency();

    if (!cards || cards.length === 0) return null;

    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>🔥 Trending Now</h2>
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

                    return (
                        <div key={card.id} className={styles.card} style={{ position: 'relative', display: 'block', padding: 0 }}>
                            <QuickActionBookmark cardId={card.id} />
                            <Link href={`/card/${card.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div className={styles.rankBadge}>{index + 1}</div>
                                <div className={styles.imageWrapper}>
                                    <SmartImage
                                        src={card.image}
                                        alt={card.name}
                                        fill
                                        sizes="(max-width: 768px) 33vw, 20vw"
                                        style={{ objectFit: 'contain' }}
                                        className={styles.image}
                                    />
                                </div>
                                <div className={styles.info}>
                                    <div className={styles.name}>{card.name}</div>
                                    <div className={styles.priceData}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className={styles.price}>{formattedPrice}</span>
                                            {card.pricePSA10 && (
                                                <div style={{ fontSize: '0.7em', color: '#888', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                                                    PSA 10: {formatPrice(card.pricePSA10 * 7.8, currency).split('.')[0]}
                                                </div>
                                            )}
                                        </div>
                                        <span className={styles.views} style={{ alignSelf: 'flex-end', marginBottom: '2px' }}>👀 {card.views || 0}</span>
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
