import DashboardTable from '@/components/merchant/DashboardTable';
import styles from './Merchant.module.css';
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;

export default async function MerchantPage() {
    const t = await getTranslations('Merchant');

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('title')}</h1>
                    <p className={styles.subtitle}>{t('subtitle', { name: 'Card Hero MK' })}</p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>{t('activeListings')}</span>
                        <span className={styles.statValue}>124</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>{t('pendingOrders')}</span>
                        <span className={styles.statValue}>8</span>
                    </div>
                </div>
            </div>

            <DashboardTable />
        </div>
    );
}
