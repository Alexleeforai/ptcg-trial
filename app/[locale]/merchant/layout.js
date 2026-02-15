
'use client';

import { Link, usePathname } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import styles from './MerchantLayout.module.css';

export default function MerchantLayout({ children }) {
    const t = useTranslations('Merchant');
    const pathname = usePathname();
    console.log('Rendering Merchant Layout');


    const navItems = [
        { label: 'Overview', href: '/merchant', icon: '📊' },
        { label: 'Profile', href: '/merchant/profile', icon: '🏢' },
        { label: 'Listings', href: '/merchant/listings', icon: '🃏' },
    ];

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>Merchant Center</h2>
                </div>
                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                <span className={styles.label}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
