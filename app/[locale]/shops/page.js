'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
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
                                    <Image src={shop.shopIcon} alt={shop.shopName} width={80} height={80} className={styles.shopIcon} style={{ objectFit: 'cover' }} />
                                ) : (
                                    <span className={styles.placeholderIcon}>🏪</span>
                                )}
                            </div>
                            <div className={styles.shopName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {shop.shopName}
                                {shop.verificationStatus === 'approved' && <VerifiedBadge />}
                            </div>
                            <div className={styles.shopDesc} style={{ textAlign: 'left', width: '100%', padding: '0 16px', boxSizing: 'border-box' }}>
                                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>店舖資料</div>
                                {shop.instagram && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.9rem', color: '#ddd' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                                        <span>{shop.instagram}</span>
                                    </div>
                                )}
                                {shop.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.9rem', color: '#ddd' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                        <span>{shop.phone}</span>
                                    </div>
                                )}
                                {!shop.instagram && !shop.phone && shop.description && (
                                    <div style={{ fontSize: '0.9rem', color: '#ccc', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {shop.description}
                                    </div>
                                )}
                                {!shop.instagram && !shop.phone && !shop.description && (
                                    <div style={{ fontSize: '0.9rem', color: '#555', fontStyle: 'italic' }}>未有提供資料</div>
                                )}
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
