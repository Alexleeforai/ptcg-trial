'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';
import QuickActionBookmark from '@/components/card/QuickActionBookmark';
import { Link } from '@/lib/navigation';
import { getHighQualityImage } from '@/lib/imageUtils';
import styles from './TopRisersSection.module.css';

import { useCurrency } from '@/hooks/useCurrency';
import { snkrdunkConvertPrice, formatPrice } from '@/lib/currency';

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
                    const isMatched = card.snkrdunkProductId > 0;
                    const hasPrice = isMatched && card.currency !== 'USD' && card.price > 0;
                    const formattedPrice = hasPrice
                        ? formatPrice(snkrdunkConvertPrice(card.snkrdunkPriceUsd, card.price, currency), currency)
                        : null;
                    const riseAmount = card.riseAmount || 0;
                    const formattedRise = hasPrice
                        ? formatPrice(snkrdunkConvertPrice(null, riseAmount, currency), currency)
                        : null;

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
                                            <span className={styles.price} style={!hasPrice ? { color: isMatched ? '#666' : '#555', fontSize: '0.8em' } : {}}>
                                                {hasPrice ? formattedPrice : isMatched ? '—' : '未配對'}
                                            </span>
                                            {hasPrice && card.snkrdunkPricePSA10 > 0 && (
                                                <div style={{ fontSize: '0.7em', color: '#888', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    PSA 10: {formatPrice(snkrdunkConvertPrice(card.snkrdunkPricePSA10Usd, card.snkrdunkPricePSA10, currency), currency).split('.')[0]}
                                                </div>
                                            )}
                                        </div>
                                        {hasPrice && formattedRise && (
                                            <span className={styles.riseAmount}>+{formattedRise}</span>
                                        )}
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
