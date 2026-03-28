
'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import styles from './DashboardTable.module.css';
import AddListingModal from './AddListingModal';

// ──────────────────── Delist Confirm Dialog ────────────────────
function DelistDialog({ item, onClose, onConfirm, loading }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#111', border: '1px solid #2a2a2a', borderRadius: '14px',
                padding: '24px 28px', width: '320px', maxWidth: '90vw',
            }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>確認下架</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.86rem', marginBottom: '20px' }}>
                    {item?.condition} — {item?.name}<br />
                    庫存將設為 0。
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #2a2a2a', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '0.88rem' }}>取消</button>
                    <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: loading ? 0.6 : 1 }}>確認下架</button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────── Sold Dialog ────────────────────
function SoldDialog({ item, onClose, onConfirm }) {
    const [channel, setChannel] = useState(null); // 'platform' | 'other'
    const [soldPrice, setSoldPrice] = useState(item?.mySell ?? '');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!channel) { alert('請選擇出售渠道'); return; }
        if (!soldPrice) { alert('請輸入售出價格'); return; }
        setLoading(true);
        await onConfirm({ channel, soldPrice: parseFloat(soldPrice) });
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#111', border: '1px solid #2a2a2a', borderRadius: '14px',
                padding: '28px 32px', width: '360px', maxWidth: '90vw',
            }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                    標記為已售出
                </h3>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px' }}>
                    {item?.condition} — {item?.name}
                </p>

                {/* Channel */}
                <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>出售渠道</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {[
                            { val: 'platform', label: '在平台出售' },
                            { val: 'other', label: '其他渠道出售' },
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => setChannel(opt.val)}
                                style={{
                                    flex: 1, padding: '9px',
                                    borderRadius: '8px', border: channel === opt.val ? '1.5px solid #6366f1' : '1px solid #2a2a2a',
                                    background: channel === opt.val ? 'rgba(99,102,241,0.15)' : '#1a1a1a',
                                    color: channel === opt.val ? '#a5b4fc' : '#9ca3af',
                                    fontSize: '0.85rem', fontWeight: channel === opt.val ? 600 : 400,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: '22px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>售出價格 (HKD)</div>
                    <input
                        type="number"
                        value={soldPrice}
                        onChange={e => setSoldPrice(e.target.value)}
                        placeholder="0"
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '9px 12px', borderRadius: '8px',
                            border: '1px solid #2a2a2a', background: '#1a1a1a',
                            color: '#fff', fontSize: '1rem',
                        }}
                    />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #2a2a2a', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '0.88rem' }}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#000', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: loading ? 0.6 : 1 }}
                    >
                        {loading ? '處理中...' : '確認售出'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────── Main Component ────────────────────
export default function DashboardTable() {
    const t = useTranslations('Merchant');
    const [items, setItems] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Edit modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Sold dialog
    const [soldDialogItem, setSoldDialogItem] = useState(null);

    // Delist confirm dialog
    const [delistConfirmItem, setDelistConfirmItem] = useState(null);

    // Action loading state (listingId => 'sold'|'delist')
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => { fetchListings(); }, []);

    const fetchListings = async () => {
        try {
            const res = await fetch('/api/merchant/listings');
            if (res.ok) {
                const data = await res.json();
                const mappedItems = data.map(item => ({
                    id: item._id || item.cardId + item.condition,
                    cardId: item.cardId,
                    _id: item._id,
                    image: item.image,
                    name: item.name,
                    set: item.set,
                    marketBuy: item.marketBuy,
                    marketSell: item.marketSell,
                    myBuy: 0,
                    mySell: item.price,
                    stock: item.stock,
                    condition: item.condition
                }));

                const grouped = Object.values(mappedItems.reduce((acc, current) => {
                    if (!acc[current.cardId]) {
                        acc[current.cardId] = { cardId: current.cardId, name: current.name, set: current.set, image: current.image, listings: [] };
                    }
                    acc[current.cardId].listings.push(current);
                    return acc;
                }, {}));

                setItems(grouped);
            }
        } catch (error) {
            console.error('Failed to fetch listings:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleEdit = (item) => { setEditingItem(item); setIsEditModalOpen(true); };
    const handleModalClose = () => { setIsEditModalOpen(false); setEditingItem(null); };
    const handleListingUpdated = () => fetchListings();

    // ── Delist (open confirm dialog — no native confirm())
    const handleDelistConfirm = async () => {
        const item = delistConfirmItem;
        setActionLoading(item._id);
        try {
            const res = await fetch(`/api/merchant/listings/${item._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delist' })
            });
            const text = await res.text();
            console.log('[Delist]', res.status, text, 'listingId:', item._id);
            if (res.ok) {
                setDelistConfirmItem(null);
                fetchListings();
            } else {
                alert(`下架失敗 (${res.status}): ${text}`);
            }
        } catch (e) {
            console.error('[Delist error]', e);
            alert('連線失敗：' + e.message);
        } finally {
            setActionLoading(null);
        }
    };

    // ── Sold
    const handleSoldConfirm = async ({ channel, soldPrice }) => {
        const item = soldDialogItem;
        setActionLoading(item._id);
        try {
            const res = await fetch(`/api/merchant/listings/${item._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sold', soldPrice, soldChannel: channel })
            });
            if (res.ok) { setSoldDialogItem(null); fetchListings(); }
        } catch (e) { alert('操作失敗'); }
        finally { setActionLoading(null); }
    };

    if (isLoadingData) return <div className={styles.loading}>Loading inventory...</div>;

    if (items.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>You have no active listings.</p>
                <p style={{ fontSize: '0.9rem', color: '#71717a' }}>Add cards from the search page to start selling!</p>
            </div>
        );
    }

    return (
        <>
            {delistConfirmItem && (
                <DelistDialog
                    item={delistConfirmItem}
                    onClose={() => setDelistConfirmItem(null)}
                    onConfirm={handleDelistConfirm}
                    loading={actionLoading === delistConfirmItem._id}
                />
            )}

            {soldDialogItem && (
                <SoldDialog
                    item={soldDialogItem}
                    onClose={() => setSoldDialogItem(null)}
                    onConfirm={handleSoldConfirm}
                />
            )}

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <div>Card</div>
                    <div>Details</div>
                    <div>Condition</div>
                    <div>Market Ref</div>
                    <div>My Sell ($)</div>
                    <div>Stock</div>
                    <div style={{ textAlign: 'right' }}>Action</div>
                </div>

                {items.map(group => (
                    <div key={group.cardId} className={styles.tableRow} style={{ alignItems: 'flex-start' }}>
                        <Link href={`/card/${group.cardId}`} style={{ display: 'contents' }}>
                            <div className={styles.cardImageContainer} style={{ marginTop: '8px', cursor: 'pointer' }}>
                                <SmartImage src={group.image} alt={group.name} fill style={{ objectFit: 'contain' }} />
                            </div>
                            <div style={{ marginTop: '8px', cursor: 'pointer' }}>
                                <div className={styles.cardName} style={{ textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)' }}>{group.name}</div>
                                <div className={styles.cardMeta}>{group.set}</div>
                            </div>
                        </Link>

                        <div style={{ gridColumn: '3 / span 5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(group.listings || []).map(item => (
                                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) minmax(100px, 1.2fr) minmax(100px, 1fr) minmax(60px, 1fr) auto', gap: '16px', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>

                                    <div>
                                        <span className={styles.readOnlyText} style={{ fontSize: '0.9rem', color: '#fbbf24' }}>
                                            {item.condition}
                                        </span>
                                    </div>

                                    <div>
                                        <div className={styles.marketPrice} style={{ color: '#ef4444' }}>Buy: ${item.marketBuy || '-'}</div>
                                        <div className={styles.marketPrice} style={{ color: '#22c55e' }}>Sell: ${item.marketSell || '-'}</div>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <span className={styles.readOnlyText} style={{ fontWeight: 'bold' }}>${item.mySell}</span>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <span className={styles.readOnlyText}>{item.stock}</span>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                        {/* Edit */}
                                        <button
                                            className={styles.iconBtn}
                                            onClick={() => handleEdit(item)}
                                            title="Edit"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>

                                        {/* Sold */}
                                        <button
                                            onClick={() => setSoldDialogItem(item)}
                                            disabled={actionLoading === item._id}
                                            title="標記為已售出"
                                            style={{
                                                padding: '4px 10px', borderRadius: '6px',
                                                border: '1px solid rgba(34,197,94,0.35)',
                                                background: 'rgba(34,197,94,0.1)',
                                                color: '#22c55e', fontSize: '0.75rem', fontWeight: 600,
                                                cursor: 'pointer', whiteSpace: 'nowrap',
                                                opacity: actionLoading === item._id ? 0.5 : 1,
                                            }}
                                        >
                                            已售出
                                        </button>

                                        {/* Delist */}
                                        <button
                                            onClick={() => setDelistConfirmItem(item)}
                                            disabled={actionLoading === item._id}
                                            title="下架"
                                            style={{
                                                padding: '4px 10px', borderRadius: '6px',
                                                border: '1px solid rgba(239,68,68,0.35)',
                                                background: 'rgba(239,68,68,0.1)',
                                                color: '#ef4444', fontSize: '0.75rem', fontWeight: 600,
                                                cursor: 'pointer', whiteSpace: 'nowrap',
                                                opacity: actionLoading === item._id ? 0.5 : 1,
                                            }}
                                        >
                                            下架
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {isEditModalOpen && (
                <AddListingModal
                    isOpen={isEditModalOpen}
                    onClose={handleModalClose}
                    onListingAdded={handleListingUpdated}
                    initialData={editingItem}
                />
            )}
        </>
    );
}
