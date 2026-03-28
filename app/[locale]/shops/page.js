'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import styles from './Shops.module.css';

// Section divider for admin mode
function SectionDivider({ title, count }) {
    return (
        <div style={{
            gridColumn: '1 / -1',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '24px 0 8px',
        }}>
            <div style={{ flex: 1, height: '1px', background: '#333' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888', letterSpacing: '0.08em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                {title} ({count})
            </span>
            <div style={{ flex: 1, height: '1px', background: '#333' }} />
        </div>
    );
}

function ShopCard({ shop, isAdmin, actionLoading, onToggle, onDelete }) {
    const isHidden = !shop.isActive;

    return (
        <div style={{ position: 'relative' }}>
            {/* Admin controls */}
            {isAdmin && (
                <div style={{
                    position: 'absolute', top: '8px', left: '8px', zIndex: 10,
                    display: 'flex', gap: '6px',
                }}>
                    <button
                        onClick={() => onToggle(shop)}
                        disabled={actionLoading === shop._id}
                        style={{
                            background: isHidden ? '#16a34a' : '#b45309',
                            border: 'none', borderRadius: '6px', padding: '4px 10px',
                            cursor: 'pointer', fontSize: '0.72rem', color: '#fff', fontWeight: 600,
                        }}
                    >
                        {actionLoading === shop._id ? '...' : isHidden ? '顯示' : '隱藏'}
                    </button>
                    <button
                        onClick={() => onDelete(shop)}
                        disabled={actionLoading === shop._id}
                        style={{
                            background: '#dc2626',
                            border: 'none', borderRadius: '6px', padding: '4px 10px',
                            cursor: 'pointer', fontSize: '0.72rem', color: '#fff', fontWeight: 600,
                        }}
                    >
                        {actionLoading === shop._id ? '...' : '刪除'}
                    </button>
                </div>
            )}

            <Link
                href={`/shops/${shop.userId}`}
                className={styles.shopCard}
                style={{ opacity: isAdmin && isHidden ? 0.45 : 1, transition: 'opacity 0.2s' }}
            >
                {isAdmin && isHidden && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(0,0,0,0.6)', color: '#f87171', fontWeight: 700,
                        borderRadius: '8px', padding: '4px 12px', fontSize: '0.8rem', zIndex: 5,
                        pointerEvents: 'none',
                    }}>已隱藏</div>
                )}
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
        </div>
    );
}

export default function ShopsPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        if (!isLoaded) return;
        checkAdminAndFetch();
    }, [isLoaded, isSignedIn]);

    const checkAdminAndFetch = async () => {
        let admin = false;
        if (isSignedIn) {
            try {
                const res = await fetch('/api/me/role');
                if (res.ok) {
                    const data = await res.json();
                    admin = data.role === 'admin';
                }
            } catch (_) {}
        }
        setIsAdmin(admin);
        await fetchShops(admin);
    };

    const fetchShops = async (admin = false) => {
        try {
            const url = admin ? '/api/shops?admin=true' : '/api/shops';
            const res = await fetch(url);
            if (res.ok) setShops(await res.json());
        } catch (error) {
            console.error('Error fetching shops:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (shop) => {
        if (!confirm(`確認要將 "${shop.shopName}" 設為${shop.isActive ? '隱藏' : '顯示'}？`)) return;
        setActionLoading(shop._id);
        try {
            const res = await fetch(`/api/admin/shops/${shop._id}`, { method: 'PATCH' });
            if (res.ok) {
                const data = await res.json();
                setShops(prev => prev.map(s => s._id === shop._id ? { ...s, isActive: data.isActive } : s));
            }
        } catch (e) { alert('操作失敗：' + e.message); }
        finally { setActionLoading(null); }
    };

    const handleDelete = async (shop) => {
        if (!confirm(`確認要永久刪除 "${shop.shopName}"？此操作不可回復。`)) return;
        setActionLoading(shop._id);
        try {
            const res = await fetch(`/api/admin/shops/${shop._id}`, { method: 'DELETE' });
            if (res.ok) setShops(prev => prev.filter(s => s._id !== shop._id));
        } catch (e) { alert('刪除失敗：' + e.message); }
        finally { setActionLoading(null); }
    };

    // Split shops into sections (admin only)
    const verifiedShops = shops.filter(s => s.isActive && s.verificationStatus === 'approved');
    const unverifiedShops = shops.filter(s => s.isActive && s.verificationStatus !== 'approved');
    const hiddenShops = shops.filter(s => !s.isActive);

    const cardProps = { isAdmin, actionLoading, onToggle: handleToggle, onDelete: handleDelete };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Partner Shops</h1>
                <p className={styles.subtitle}>Discover trusted merchants and find your favorite cards.</p>
                {isAdmin && (
                    <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '8px', padding: '5px 14px', display: 'inline-block' }}>
                        Admin Mode — 顯示所有店舖（包括隱藏中的）
                    </div>
                )}
            </div>

            {loading ? (
                <div className={styles.loading}>Loading shops...</div>
            ) : isAdmin ? (
                /* ── Admin view: three sections separated by dividers ── */
                <div className={styles.grid}>
                    {/* Section 1: Verified */}
                    <SectionDivider title="已認證" count={verifiedShops.length} />
                    {verifiedShops.length === 0
                        ? <div style={{ gridColumn: '1 / -1', color: '#555', fontSize: '0.9rem', padding: '12px 0' }}>暫無已認證店舖</div>
                        : verifiedShops.map(shop => <ShopCard key={shop._id} shop={shop} {...cardProps} />)
                    }

                    {/* Section 2: Unverified */}
                    <SectionDivider title="未認證" count={unverifiedShops.length} />
                    {unverifiedShops.length === 0
                        ? <div style={{ gridColumn: '1 / -1', color: '#555', fontSize: '0.9rem', padding: '12px 0' }}>暫無未認證店舖</div>
                        : unverifiedShops.map(shop => <ShopCard key={shop._id} shop={shop} {...cardProps} />)
                    }

                    {/* Section 3: Hidden */}
                    <SectionDivider title="已隱藏" count={hiddenShops.length} />
                    {hiddenShops.length === 0
                        ? <div style={{ gridColumn: '1 / -1', color: '#555', fontSize: '0.9rem', padding: '12px 0' }}>暫無已隱藏店舖</div>
                        : hiddenShops.map(shop => <ShopCard key={shop._id} shop={shop} {...cardProps} />)
                    }
                </div>
            ) : (
                /* ── Normal user view ── */
                <div className={styles.grid}>
                    {shops.map(shop => <ShopCard key={shop._id} shop={shop} {...cardProps} />)}
                    {shops.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#555' }}>
                            No active shops found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
