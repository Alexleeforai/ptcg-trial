'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import SmartImage from '@/components/SmartImage';
import QuickActionBookmark from '@/components/card/QuickActionBookmark';
import { getHighQualityImage } from '@/lib/imageUtils';
import styles from './LatestSets.module.css';
import { snkrdunkToHkd } from '@/lib/currency';

export default function LatestSets({ sets, rate = 0.052 }) {
    if (!sets || sets.length === 0) return null;

    const t = useTranslations('LatestSets');

    return (
        <div className={styles.section}>
            <h2 className={styles.title}>{t('title')}</h2>
            <div className={styles.grid}>
                {sets.map(product => {
                    const hasPrice = product.snkrdunkProductId > 0 && product.currency !== 'USD' && product.price > 0;
                    const hkdPrice = hasPrice ? snkrdunkToHkd(product.snkrdunkPriceUsd, product.price, rate) : 0;
                    const psa10Hkd = hasPrice && product.snkrdunkPricePSA10 > 0
                        ? snkrdunkToHkd(product.snkrdunkPricePSA10Usd, product.snkrdunkPricePSA10, rate) : 0;

                    return (
                        <div key={product.id} className={styles.setCard} style={{ position: 'relative', display: 'block', padding: 0 }}>
                            <QuickActionBookmark cardId={product.id} />
                            <Link href={`/card/${product.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div className={styles.imageWrapper}>
                                    <SmartImage
                                        src={product.image}
                                        alt={product.name}
                                        className={styles.productImage}
                                        fill
                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <div className={styles.setInfo}>
                                    <h3 className={styles.setName}>{product.name}</h3>
                                    {product.releaseDate && (
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>
                                            {product.releaseDate}
                                        </div>
                                    )}
                                    <div className={styles.priceRow}>
                                        <span className={styles.price} style={!hasPrice ? { color: '#555', fontSize: '0.85em' } : {}}>
                                            {hasPrice ? `HK$${hkdPrice.toLocaleString()}` : '未配對'}
                                        </span>
                                        {psa10Hkd > 0 && (
                                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                PSA 10: HK${psa10Hkd.toLocaleString()}
                                            </div>
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
