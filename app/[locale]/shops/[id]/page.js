'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
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

    // Group listings by cardId
    const groupedListings = Object.values(listings.reduce((acc, current) => {
        if (!acc[current.cardId]) {
            acc[current.cardId] = {
                cardId: current.cardId,
                name: current.name,
                set: current.set,
                image: current.image,
                quotes: []
            };
        }
        acc[current.cardId].quotes.push({
            id: current._id,
            condition: current.condition,
            price: current.price,
            stock: current.stock
        });
        return acc;
    }, {}));

    return (
        <div className={styles.container}>
            {/* Shop Header */}
            <header className={styles.shopHeader}>
                <div className={styles.iconWrapper}>
                    {profile.shopIcon ? (
                        <Image src={profile.shopIcon} alt={profile.shopName} width={100} height={100} className={styles.shopIcon} style={{ objectFit: 'cover' }} />
                    ) : (
                        <span style={{ fontSize: '3rem', lineHeight: '100px', display: 'block', textAlign: 'center' }}>🏪</span>
                    )}
                </div>
                <h1 className={styles.shopName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {profile.shopName}
                    {profile.verificationStatus === 'approved' && <VerifiedBadge />}
                </h1>

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
                            window.__chatWidget.startChat(profile.userId, profile.shopName);
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
                <h2 className={styles.listingsTitle}>Card Listings ({groupedListings.length})</h2>

                {groupedListings.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#555', padding: '40px' }}>This shop has no active listings.</p>
                ) : (
                    <div className={styles.listingsGrid}>
                        {groupedListings.map(cardGroup => (
                            <div key={cardGroup.cardId} className={styles.cardItem} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div className={styles.imageContainer} style={{ width: '80px', height: '112px', flexShrink: 0, position: 'relative' }}>
                                        <SmartImage
                                            src={cardGroup.image}
                                            alt={cardGroup.name}
                                            fill
                                            style={{ objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 className={styles.cardName} style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>{cardGroup.name}</h3>
                                        <p className={styles.cardSet} style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#a1a1aa' }}>{cardGroup.set}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {cardGroup.quotes.map(quote => (
                                        <div key={quote.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#a1a1aa', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                                <span>{quote.condition}</span>
                                                <span style={{ fontSize: '0.7rem', color: '#555' }}>(x{quote.stock})</span>
                                            </span>
                                            <span style={{ fontWeight: 600, color: '#22c55e', fontSize: '0.95rem' }}>
                                                ${quote.price.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
