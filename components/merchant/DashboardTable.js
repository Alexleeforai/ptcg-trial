
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import SmartImage from '@/components/SmartImage';
import styles from './DashboardTable.module.css';
import AddListingModal from './AddListingModal';

export default function DashboardTable() {
    const t = useTranslations('Merchant');
    const [items, setItems] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Modal State for Editing
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Fetch Listings on Mount
    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const res = await fetch('/api/merchant/listings');
            if (res.ok) {
                const data = await res.json();
                const mappedItems = data.map(item => ({
                    id: item._id || item.cardId + item.condition, // Ensure unique key for React
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

                // Group by cardId
                const grouped = Object.values(mappedItems.reduce((acc, current) => {
                    if (!acc[current.cardId]) {
                        acc[current.cardId] = {
                            cardId: current.cardId,
                            name: current.name,
                            set: current.set,
                            image: current.image,
                            listings: []
                        };
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

    // Open Edit Modal
    const handleEdit = (item) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };

    const handleModalClose = () => {
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    const handleListingUpdated = () => {
        fetchListings(); // Refresh data
    };

    if (isLoadingData) {
        return <div className={styles.loading}>Loading inventory...</div>;
    }

    if (items.length === 0) {
        // ... Keep empty state ...
        return (
            <div className={styles.emptyState}>
                <p>You have no active listings.</p>
                <p style={{ fontSize: '0.9rem', color: '#71717a' }}>Add cards from the search page to start selling!</p>
            </div>
        );
    }

    return (
        <>
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
                        <div className={styles.cardImageContainer} style={{ marginTop: '8px' }}>
                            <SmartImage
                                src={group.image}
                                alt={group.name}
                                fill
                                style={{ objectFit: 'contain' }}
                            />
                        </div>

                        <div style={{ marginTop: '8px' }}>
                            <div className={styles.cardName}>{group.name}</div>
                            <div className={styles.cardMeta}>{group.set}</div>
                        </div>

                        {/* Right side spans the remaining columns */}
                        <div style={{ gridColumn: '3 / span 5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {group.listings.map(item => (
                                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) minmax(100px, 1.2fr) minmax(100px, 1fr) minmax(60px, 1fr) 50px', gap: '16px', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>

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

                                    <div className={styles.actionCell} style={{ justifyContent: 'flex-end' }}>
                                        <button
                                            className={styles.iconBtn}
                                            onClick={() => handleEdit(item)}
                                            title="Edit"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Reuse AddListingModal for Editing */}
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
