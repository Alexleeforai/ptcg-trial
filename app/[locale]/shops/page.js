'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Shops.module.css';

export default function ShopsPage() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const res = await fetch('/api/shops');
            if (res.ok) {
                const data = await res.json();
                setShops(data);
            }
        } catch (error) {
            console.error('Error fetching shops:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Partner Shops</h1>
                <p className={styles.subtitle}>Discover trusted merchants and find your favorite cards.</p>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading shops...</div>
            ) : (
                <div className={styles.grid}>
                    {shops.map(shop => (
                        <Link href={`/shops/${shop.userId}`} key={shop._id} className={styles.shopCard}>
                            <div className={styles.iconWrapper}>
                                {shop.shopIcon ? (
                                    <img src={shop.shopIcon} alt={shop.shopName} className={styles.shopIcon} />
                                ) : (
                                    <span className={styles.placeholderIcon}>🏪</span>
                                )}
                            </div>
                            <div className={styles.shopName}>{shop.shopName}</div>
                            <div className={styles.shopDesc}>
                                {shop.description || 'No description available.'}
                            </div>
                            <div className={styles.visitBtn}>Visit Shop</div>
                        </Link>
                    ))}

                    {shops.length === 0 && !loading && (
                        <div style={{ colSpan: 3, textAlign: 'center', color: '#555' }}>
                            No active shops found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
