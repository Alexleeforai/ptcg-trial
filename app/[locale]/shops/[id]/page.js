'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import styles from './ShopDetail.module.css';

// Admin-only panel showing profile status and completeness
function AdminPanel({ profile }) {
    const fieldStatus = [
        { label: '店舖名稱', value: profile.shopName, required: true },
        { label: '電郵', value: profile.email, required: true },
        { label: '電話', value: profile.phone },
        { label: '地址', value: profile.address },
        { label: '店舖描述', value: profile.description },
        { label: 'Instagram', value: profile.instagram },
        { label: '店舖圖示', value: profile.shopIcon },
        { label: '商業登記文件', value: profile.businessRegistrationImage },
    ];

    const missingFields = fieldStatus.filter(f => !f.value);
    const completedCount = fieldStatus.filter(f => f.value).length;
    const completionPct = Math.round((completedCount / fieldStatus.length) * 100);

    const verificationLabel = {
        unsubmitted: '未提交認證',
        pending: '認證申請審核中',
        approved: '已認證',
        rejected: '認證被拒',
    };

    const verificationColor = {
        unsubmitted: '#6b7280',
        pending: '#f59e0b',
        approved: '#22c55e',
        rejected: '#ef4444',
    };

    return (
        <div style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '28px',
            fontSize: '0.88rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, color: '#a5b4fc', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Admin — 店舖資料一覽
                </span>
                <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                    User ID: {profile.userId}
                </span>
            </div>

            {/* Key status row */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <StatusBadge
                    label="可見度"
                    value={profile.isActive ? '公開中' : '已隱藏'}
                    color={profile.isActive ? '#22c55e' : '#ef4444'}
                />
                <StatusBadge
                    label="認證狀態"
                    value={verificationLabel[profile.verificationStatus] || profile.verificationStatus}
                    color={verificationColor[profile.verificationStatus] || '#6b7280'}
                />
                <StatusBadge
                    label="資料完整度"
                    value={`${completionPct}% (${completedCount}/${fieldStatus.length})`}
                    color={completionPct === 100 ? '#22c55e' : completionPct >= 60 ? '#f59e0b' : '#ef4444'}
                />
            </div>

            <div style={{ height: '1px', background: 'rgba(99,102,241,0.2)', margin: '14px 0' }} />

            {/* Field table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
                {fieldStatus.map(f => (
                    <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: '#9ca3af', fontWeight: f.required ? 600 : 400 }}>
                            {f.label}{f.required ? ' *' : ''}
                        </span>
                        {f.value ? (
                            f.label === '店舖圖示' || f.label === '商業登記文件'
                                ? <span style={{ color: '#22c55e' }}>已上傳</span>
                                : <span style={{ color: '#d1d5db', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {String(f.value).substring(0, 40)}{String(f.value).length > 40 ? '...' : ''}
                                </span>
                        ) : (
                            <span style={{ color: f.required ? '#ef4444' : '#6b7280' }}>
                                {f.required ? '未填寫 (必填)' : '未填寫'}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Timestamps */}
            <div style={{ height: '1px', background: 'rgba(99,102,241,0.2)', margin: '14px 0' }} />
            <div style={{ display: 'flex', gap: '24px', color: '#6b7280', fontSize: '0.78rem' }}>
                <span>建立: {profile.createdAt ? new Date(profile.createdAt).toLocaleString('zh-HK') : 'N/A'}</span>
                <span>最後更新: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString('zh-HK') : 'N/A'}</span>
            </div>
        </div>
    );
}

function StatusBadge({ label, value, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '5px 12px' }}>
            <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>{label}:</span>
            <span style={{ color, fontWeight: 600, fontSize: '0.82rem' }}>{value}</span>
        </div>
    );
}

export default function ShopDetailPage() {
    const params = useParams();
    const { id } = params;

    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchShopDetails();
    }, [id]);

    const fetchShopDetails = async () => {
        try {
            const res = await fetch(`/api/shops/${id}`);
            if (res.ok) setShopData(await res.json());
        } catch (error) {
            console.error('Error fetching shop details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading shop...</div>;
    if (!shopData) return <div className={styles.loading}>Shop not found.</div>;

    const { profile, listings, isAdmin } = shopData;

    // Group listings by cardId
    const groupedListings = Object.values(listings.reduce((acc, current) => {
        if (!acc[current.cardId]) {
            acc[current.cardId] = { cardId: current.cardId, name: current.name, set: current.set, image: current.image, quotes: [] };
        }
        acc[current.cardId].quotes.push({ id: current._id, condition: current.condition, price: current.price, stock: current.stock });
        return acc;
    }, {}));

    return (
        <div className={styles.container}>

            {/* Admin Panel */}
            {isAdmin && <AdminPanel profile={profile} />}

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
                            <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
                                {profile.instagram}
                            </a>
                        </div>
                    )}
                    {profile.email && <div className={styles.metaItem}>{profile.email}</div>}
                    {profile.phone && <div className={styles.metaItem}>{profile.phone}</div>}
                </div>

                <p className={styles.shopDesc}>{profile.description}</p>

                {/* Chat button */}
                <button
                    onClick={() => {
                        if (window.__chatWidget) {
                            window.__chatWidget.startChat(profile.userId, profile.shopName);
                        } else {
                            alert('Please sign in to chat with this shop.');
                        }
                    }}
                    style={{
                        marginTop: '16px', padding: '10px 24px',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        border: 'none', borderRadius: '24px', color: 'white',
                        fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    Chat with Shop
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
                                        <SmartImage src={cardGroup.image} alt={cardGroup.name} fill style={{ objectFit: 'contain' }} />
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
                                                HK${quote.price.toLocaleString()}
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
