'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import NextLink from 'next/link';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { SignedIn, SignedOut, UserButton, useUser, useClerk } from '@clerk/nextjs';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySelector from '@/components/ui/CurrencySelector';
import CardScanner from '@/components/search/CardScanner';
import styles from './MobileNavDrawer.module.css';

export default function MobileNavDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const t = useTranslations('Header');
    const { user } = useUser();
    const { signOut } = useClerk();
    const isMerchant = user?.publicMetadata?.role === 'merchant';
    const isAdmin = user?.publicMetadata?.role === 'admin';

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent background scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const toggleDrawer = () => setIsOpen(!isOpen);
    const closeDrawer = () => setIsOpen(false);

    const drawerContent = (
        <>
            {/* Overlay */}
            {isOpen && (
                <div className={styles.overlay} onClick={closeDrawer} />
            )}

            {/* Drawer */}
            <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
                <div className={styles.drawerHeader}>
                    <span className={styles.brand}>🎴 {t('brand')}</span>
                    <button className={styles.closeBtn} onClick={closeDrawer}>✕</button>
                </div>

                <div className={styles.drawerContent}>
                    <nav className={styles.navMenu}>
                        <Link href="/browse" className={styles.navLink} onClick={closeDrawer}>
                            <span className={styles.navIcon}>🔍</span>
                            {t('browse')}
                        </Link>

                        <button className={`${styles.navLink} ${styles.navBtn}`} onClick={() => { setShowScanner(true); closeDrawer(); }}>
                            <span className={styles.navIcon}>📷</span>
                            以圖搜尋
                        </button>

                        <Link href="/shops" className={styles.navLink} onClick={closeDrawer}>
                            <span className={styles.navIcon}>🏪</span>
                            {t('shops')}
                        </Link>

                        <SignedIn>
                            {isMerchant && (
                                <Link href="/merchant" className={styles.navLink} onClick={closeDrawer}>
                                    <span className={styles.navIcon}>📊</span>
                                    Dashboard
                                </Link>
                            )}

                            {isAdmin && (
                                <Link href="/admin/verifications" className={styles.navLink} onClick={closeDrawer} style={{ color: '#4ade80' }}>
                                    <span className={styles.navIcon}>🛡️</span>
                                    Admin Panel
                                </Link>
                            )}

                            {!isMerchant && (
                                <Link href="/collection" className={styles.navLink} onClick={closeDrawer}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}>
                                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                    </svg>
                                    {t('collection')}
                                </Link>
                            )}
                        </SignedIn>

                        <div className={styles.divider} />

                        <div className={styles.utilities}>
                            <div className={styles.utilityItem}>
                                <span className={styles.utilityLabel}>Currency:</span>
                                <CurrencySelector />
                            </div>
                            <div className={styles.utilityItem}>
                                <span className={styles.utilityLabel}>Language:</span>
                                <LanguageSwitcher />
                            </div>
                        </div>

                        <div className={styles.divider} />

                        <div className={styles.authSection}>
                            <SignedOut>
                                <NextLink href="/sign-in" className={styles.authLink} onClick={closeDrawer}>
                                    Login
                                </NextLink>
                                <Link href="/sign-up" className={`${styles.authLink} ${styles.primaryAuthLink}`} onClick={closeDrawer}>
                                    Register
                                </Link>
                            </SignedOut>
                            <SignedIn>
                                <div className={styles.userProfile}>
                                    <UserButton afterSignOutUrl="/" />
                                    <span className={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress}</span>
                                </div>
                                <button
                                    className={styles.signOutBtn}
                                    onClick={() => {
                                        signOut();
                                        closeDrawer();
                                    }}
                                >
                                    Sign Out
                                </button>
                            </SignedIn>
                        </div>
                    </nav>
                </div>
            </div>
        </>
    );

    return (
        <div className={styles.mobileNavContainer}>
            {/* Hamburger Button */}
            <button
                className={styles.hamburgerBtn}
                onClick={toggleDrawer}
                aria-label="Toggle menu"
            >
                <span className={styles.hamburgerIcon}>☰</span>
            </button>

            {mounted && createPortal(drawerContent, document.body)}

            {showScanner && (
                <CardScanner onClose={() => setShowScanner(false)} />
            )}
        </div>
    );
}
