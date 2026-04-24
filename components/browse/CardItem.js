'use client';

import { Link } from '@/lib/navigation';
import SmartImage from '@/components/SmartImage';
import styles from '@/components/home/TrendingSection.module.css';
import { useCurrency } from '@/hooks/useCurrency';
import { snkrdunkConvertPrice, formatPrice } from '@/lib/currency';

export default function CardItem({ card }) {
    const currency = useCurrency();

    if (!card) return null;

    const isMatched = card.snkrdunkProductId > 0;
    const hasPrice = isMatched && card.currency !== 'USD' && card.price > 0;
    const displayPrice = hasPrice ? snkrdunkConvertPrice(card.snkrdunkPriceUsd, card.price, currency) : null;
    const formattedPrice = hasPrice ? formatPrice(displayPrice, currency) : null;

    return (
        <Link href={`/card/${card.id}`} className={styles.card}>
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
                    <span className={styles.price} style={!hasPrice ? { color: hasPrice === false && isMatched ? '#666' : '#555', fontSize: '0.8em' } : {}}>
                        {hasPrice ? formattedPrice : isMatched ? '—' : '未配對'}
                    </span>
                    <span className={styles.views} style={{ fontSize: '0.8rem', color: '#888' }}>
                        {card.set}
                    </span>
                </div>
            </div>
        </Link>
    );
}
