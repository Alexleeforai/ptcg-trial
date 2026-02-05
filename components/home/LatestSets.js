'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { getHighQualityImage } from '@/lib/imageUtils';
import styles from './LatestSets.module.css';

export default function LatestSets({ sets, rate = 0.052 }) {
    if (!sets || sets.length === 0) return null;

    const t = useTranslations('LatestSets');

    return (
        <div className={styles.section}>
            <h2 className={styles.title}>{t('title')}</h2>
            <div className={styles.grid}>
                {sets.map(product => {
                    // Support both formats:
                    // Old format: product.price (JPY)
                    // PriceCharting format: product.priceRaw (USD)
                    // Use FIXED rates to avoid hydration mismatch
                    let hkdPrice = 0;
                    let jpyPrice = 0;

                    if (product.priceRaw && product.currency === 'USD') {
                        // PriceCharting data (USD) - fixed conversion rates
                        const usdPrice = product.priceRaw;
                        hkdPrice = Math.round(usdPrice * 7.8); // USD to HKD
                        jpyPrice = Math.round(usdPrice * 150); // USD to JPY
                    } else if (product.price) {
                        // Old format (JPY) - fixed conversion rates
                        jpyPrice = product.price;
                        hkdPrice = Math.round(product.price * 0.052); // JPY to HKD (fixed rate)
                    }

                    return (
                        <Link key={product.id} href={`/card/${product.id}`} className={styles.setCard}>
                            <div className={styles.imageWrapper}>
                                {product.image ? (
                                    <Image
                                        src={getHighQualityImage(product.image)}
                                        alt={product.name}
                                        className={styles.productImage}
                                        fill
                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                        style={{ objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#1a1a1a',
                                        color: '#666',
                                        fontSize: '0.8rem'
                                    }}>
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className={styles.setInfo}>
                                <h3 className={styles.setName}>{product.name}</h3>
                                {product.releaseDate && (
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>
                                        {product.releaseDate}
                                    </div>
                                )}
                                <div className={styles.priceRow}>
                                    <span className={styles.price}>HK${hkdPrice.toLocaleString()}</span>
                                    {product.pricePSA10 && (
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            PSA 10: ${Math.round(product.pricePSA10 * 7.8).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
