'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import styles from './TopRisersSection.module.css';

export default function TopRisersSection({ cards, rate = 0.052 }) {
    if (!cards || cards.length === 0) return null;

    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>📈 Top Risers</h2>
            </div>
            <div className={styles.grid}>
                {cards.map((card, index) => {
                    const price = card.price || 0;
                    const hkdPrice = Math.round(price * rate);

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
                                        <span className={styles.price}>HK${hkdPrice.toLocaleString()}</span>
                                        <span className={styles.originalPrice}>(¥{price.toLocaleString()})</span>
                                    </div>
                                    <span className={styles.riseAmount}>
                                        +¥{Math.round(card.riseAmount).toLocaleString()}
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
