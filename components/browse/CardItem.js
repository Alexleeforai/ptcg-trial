'use client';

import { Link } from '@/lib/navigation';
import Image from 'next/image';
import styles from '@/components/home/TrendingSection.module.css';
import { useCurrency } from '@/hooks/useCurrency';
import { snkrdunkConvertPrice, formatPrice } from '@/lib/currency';

function snkHasPrice(card) {
    return card.snkrdunkProductId > 0 && card.currency !== 'USD' && card.price > 0;
}

export default function CardItem({ card }) {
    const currency = useCurrency();

    if (!card) return null;

    const hasPrice = snkHasPrice(card);
    const displayPrice = hasPrice ? snkrdunkConvertPrice(card.snkrdunkPriceUsd, card.price, currency) : null;
    const formattedPrice = hasPrice ? formatPrice(displayPrice, currency) : null;

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
                    <span className={styles.price} style={!hasPrice ? { color: '#555', fontSize: '0.8em' } : {}}>
                        {hasPrice ? formattedPrice : '未配對'}
                    </span>
                    <span className={styles.views} style={{ fontSize: '0.8rem', color: '#888' }}>
                        {card.set}
                    </span>
                </div>
            </div>
        </Link>
    );
}
