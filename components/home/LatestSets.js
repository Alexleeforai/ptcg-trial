'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import styles from './LatestSets.module.css';

export default function LatestSets({ sets, rate = 0.052 }) {
    if (!sets || sets.length === 0) return null;

    const t = useTranslations('LatestSets');

    return (
        <div className={styles.section}>
            <h2 className={styles.title}>{t('title')}</h2>
            <div className={styles.grid}>
                {sets.map(product => {
                    const hkdPrice = Math.round((product.price || 0) * rate);
                    return (
                        <Link key={product.id} href={`/card/${product.id}`} className={styles.setCard}>
                            <div className={styles.imageWrapper}>
                                {product.image ? (
                                    <Image
                                        src={product.image}
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
                                    <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>
                                        (¥{(product.price || 0).toLocaleString()})
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
