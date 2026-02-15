
import styles from './Merchant.module.css';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/navigation';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Listing from '@/models/Listing';
import MerchantProfile from '@/models/MerchantProfile';

export const revalidate = 0; // Dynamic data, do not cache

async function getData(userId) {
    await connectToDatabase();
    const [listingCount, profile] = await Promise.all([
        Listing.countDocuments({ merchantId: userId }),
        MerchantProfile.findOne({ userId }).lean()
    ]);

    return {
        listingCount,
        shopName: profile?.shopName || 'Merchant'
    };
}

export default async function MerchantOverviewPage() {
    const t = await getTranslations('Merchant');
    const { userId } = await auth();

    // Safety check, though middleware should handle this
    if (!userId) return null;

    const { listingCount, shopName } = await getData(userId);

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Merchant Overview</h1>
                    <p className={styles.subtitle}>Welcome back, {shopName}.</p>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Active Listings</h3>
                    <p className={styles.statNumber}>{listingCount}</p>
                    <Link href="/merchant/listings" className={styles.statLink}>Manage Listings &rarr;</Link>
                </div>

                {/* Placeholder Metrics - To be implemented */}
                <div className={styles.statCard} style={{ opacity: 0.7 }}>
                    <h3>Pending Orders</h3>
                    <p className={styles.statNumber}>0</p>
                    <span className={styles.statLink} style={{ cursor: 'default', textDecoration: 'none' }}>Coming Soon</span>
                </div>
                <div className={styles.statCard} style={{ opacity: 0.7 }}>
                    <h3>Total Sales (Month)</h3>
                    <p className={styles.statNumber}>HK$ 0</p>
                </div>
                <div className={styles.statCard} style={{ opacity: 0.7 }}>
                    <h3>Store Views</h3>
                    <p className={styles.statNumber}>-</p>
                </div>
            </div>
        </div>
    );
}
