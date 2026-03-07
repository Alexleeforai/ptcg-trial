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
                    <span className={styles.brand}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><rect x="2" y="6" width="14" height="15" rx="2" ry="2"></rect><rect x="8" y="3" width="14" height="15" rx="2" ry="2"></rect></svg>
                        {t('brand')}
                    </span>
                    <button className={styles.closeBtn} onClick={closeDrawer}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                <div className={styles.drawerContent}>
                    <nav className={styles.navMenu}>
                        <Link href="/browse" className={styles.navLink} onClick={closeDrawer}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                            {t('browse')}
                        </Link>

                        <button className={`${styles.navLink} ${styles.navBtn}`} onClick={() => { setShowScanner(true); closeDrawer(); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                            以圖搜尋
                        </button>

                        <Link href="/shops" className={styles.navLink} onClick={closeDrawer}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path></svg>
                            {t('shops')}
                        </Link>

                        <SignedIn>
                            {isMerchant && (
                                <Link href="/merchant" className={styles.navLink} onClick={closeDrawer}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                                    我的店舖
                                </Link>
                            )}

                            {isAdmin && (
                                <Link href="/admin/verifications" className={styles.navLink} onClick={closeDrawer} style={{ color: '#4ade80' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.hamburgerIcon}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
            </button>

            {mounted && createPortal(drawerContent, document.body)}

            {showScanner && (
                <CardScanner onClose={() => setShowScanner(false)} />
            )}
        </div>
    );
}
