'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SmartImage from '@/components/SmartImage';
import styles from './ShopDetail.module.css';

export default function ShopDetailPage() {
    const params = useParams();
    const { id } = params;

    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchShopDetails();
        }
    }, [id]);

    const fetchShopDetails = async () => {
        try {
            const res = await fetch(`/api/shops/${id}`);
            if (res.ok) {
                const data = await res.json();
                setShopData(data);
            }
        } catch (error) {
            console.error('Error fetching shop details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading shop...</div>;
    if (!shopData) return <div className={styles.loading}>Shop not found.</div>;

    const { profile, listings } = shopData;

    return (
        <div className={styles.container}>
            {/* Shop Header */}
            <header className={styles.shopHeader}>
                <div className={styles.iconWrapper}>
                    {profile.shopIcon ? (
                        <img src={profile.shopIcon} alt={profile.shopName} className={styles.shopIcon} />
                    ) : (
                        <span style={{ fontSize: '3rem', lineHeight: '100px', display: 'block', textAlign: 'center' }}>🏪</span>
                    )}
                </div>
                <h1 className={styles.shopName}>{profile.shopName}</h1>

                <div className={styles.shopMeta}>
                    {profile.instagram && (
                        <div className={styles.metaItem}>
                            <span>📸</span>
                            <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
                                {profile.instagram}
                            </a>
                        </div>
                    )}
                    {profile.email && <div className={styles.metaItem}>📧 {profile.email}</div>}
                    {profile.phone && <div className={styles.metaItem}>📞 {profile.phone}</div>}
                </div>

                <p className={styles.shopDesc}>{profile.description}</p>

                {/* Chat with Shop button */}
                <button
                    onClick={() => {
                        if (window.__chatWidget) {
                            window.__chatWidget.startChat(profile.userId);
                        } else {
                            alert('Please sign in to chat with this shop.');
                        }
                    }}
                    style={{
                        marginTop: '16px',
                        padding: '10px 24px',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        border: 'none',
                        borderRadius: '24px',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    💬 Chat with Shop
                </button>
            </header>

            {/* Active Listings */}
            <section>
                <h2 className={styles.listingsTitle}>Active Listings ({listings.length})</h2>

                {listings.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#555', padding: '40px' }}>This shop has no active listings.</p>
                ) : (
                    <div className={styles.listingsGrid}>
                        {listings.map(item => (
                            <div key={item._id} className={styles.cardItem}>
                                <div className={styles.imageContainer}>
                                    <SmartImage
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <div className={styles.cardInfo}>
                                    <h3 className={styles.cardName}>{item.name}</h3>
                                    <p className={styles.cardSet}>{item.set}</p>

                                    <div className={styles.cardFooter}>
                                        <span className={styles.conditionBadge}>{item.condition}</span>
                                        <span className={styles.price}>${item.price.toLocaleString()}</span>
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#555', textAlign: 'right' }}>
                                        Stock: {item.stock}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
