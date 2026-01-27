'use client';

import { Link } from '@/lib/navigation';
import Image from 'next/image';
import styles from '@/components/home/TrendingSection.module.css';
import { useCurrency } from '@/hooks/useCurrency';
import { convertPrice, formatPrice } from '@/lib/currency';

export default function CardItem({ card }) {
    const currency = useCurrency();

    // Safety check
    if (!card) return null;

    const originalPrice = card.price || 0;
    const cardCurrency = card.currency || 'JPY';

    const displayPrice = convertPrice(originalPrice, cardCurrency, currency);
    const formattedPrice = formatPrice(displayPrice, currency);

    return (
        <Link href={`/card/${card.id}`} className={styles.card}>
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
                    <span className={styles.price}>{formattedPrice}</span>
                    <span className={styles.views} style={{ fontSize: '0.8rem', color: '#888' }}>
                        {card.set}
                    </span>
                </div>
            </div>
        </Link>
    );
}
