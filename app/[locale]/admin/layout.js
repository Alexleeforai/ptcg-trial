'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: '📊' },
        { name: 'Verifications', path: '/admin/verifications', icon: '✅' },
        { name: 'Users', path: '/admin/users', icon: '👥' },
        { name: 'Set Sync', path: '/admin/sets', icon: '🔄' },
    ];

    return (
        <div className={styles.adminContainer}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>Admin Panel</h2>
                </div>
                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const isActive = pathname === `/en${item.path}` || pathname === `/zh-HK${item.path}` || pathname === `/zh-CN${item.path}` || pathname === item.path;
                        return (
                            <Link
                                href={item.path}
                                key={item.path}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
