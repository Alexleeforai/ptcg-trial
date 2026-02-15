
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import styles from '../Merchant.module.css';
import DashboardTable from '@/components/merchant/DashboardTable';
import AddListingModal from '@/components/merchant/AddListingModal';

export default function MerchantListingsPage() {
    const t = useTranslations('Merchant');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    // Key to force re-render of table after adding
    const [refreshKey, setRefreshKey] = useState(0);

    const handleListingAdded = () => {
        setRefreshKey(prev => prev + 1);
        // Maybe show toast notification
    };

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Manage Listings</h1>
                    <p className={styles.subtitle}>Update stock and prices for your inventory.</p>
                </div>
                <button
                    className={styles.primaryBtn}
                    onClick={() => setIsAddModalOpen(true)}
                    style={{
                        padding: '12px 24px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    + Add New Listing
                </button>
            </div>

            <DashboardTable key={refreshKey} />

            <AddListingModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onListingAdded={handleListingAdded}
            />
        </div>
    );
}
