'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Link, usePathname } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySelector from '@/components/ui/CurrencySelector';
import styles from './Header.module.css';
import SearchAutocomplete from '@/components/ui/SearchAutocomplete';
import MobileNavDrawer from './MobileNavDrawer';

export default function Header() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const isHome = pathname === '/';
  
  // Hydration safety for Clerk user metadata (which can differ between stale SSR cookie and live client fetch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { user } = useUser();
  const isMerchant = mounted && user?.publicMetadata?.role === 'merchant';
  const isAdmin = mounted && user?.publicMetadata?.role === 'admin';

  // For the collection link, we default to showing it on SSR unless we know they are a merchant post-mount
  const showCollection = !mounted || !isMerchant;


  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          <Link href="/" className={styles.brand}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.logoIcon}><rect x="2" y="6" width="14" height="15" rx="2" ry="2"></rect><rect x="8" y="3" width="14" height="15" rx="2" ry="2"></rect></svg>
            <span className={styles.brandName}>{t('brand')}</span>
          </Link>
          <div className={styles.actions}>
            {!isHome && (
              <div className={styles.headerSearch}>
                <SearchAutocomplete
                  className={styles.searchComponent}
                  placeholder={t('search')}
                />
              </div>
            )}
            {/* Mobile Drawer (Visible on small screens) */}
            <MobileNavDrawer />

            <nav className={`${styles.nav} ${styles.desktopNav}`}>
              {mounted && (
                <>
                  <SignedOut>
                    <Link href="/browse" className={styles.navLink}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                      <span className={styles.navText}>{t('browse')}</span>
                    </Link>
                    <Link href="/shops" className={styles.navLink}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path></svg>
                      <span className={styles.navText}>{t('shops')}</span>
                    </Link>
                    {/* Auth routes are outside locale, use standard NextLink to avoid prefix */}
                    <NextLink href="/sign-in" className={styles.navLink}>
                      <span className={styles.navText}>Login</span>
                    </NextLink>
                    {/* Register is inside locale because we created app/[locale]/sign-up */}
                    <Link href="/sign-up" className={styles.navLink}>
                      <span className={styles.navText}>Register</span>
                    </Link>
                  </SignedOut>
                  
                  <SignedIn>
                    <Link href="/browse" className={styles.navLink}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                      <span className={styles.navText}>{t('browse')}</span>
                    </Link>

                    {/* Only Merchants see this */}
                    {isMerchant && (
                      <Link href="/merchant" className={styles.merchantLink}>
                        <span className={styles.navText}>我的店舖</span>
                      </Link>
                    )}

                    {/* Only Admins see this */}
                    {isAdmin && (
                      <Link href="/admin/verifications" className={styles.merchantLink}>
                        <span className={styles.navText} style={{ color: '#4ade80' }}>Admin Panel</span>
                      </Link>
                    )}

                    {showCollection && (
                      <Link href="/collection" className={styles.navLink}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}>
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                        <span className={styles.navText}>{t('collection')}</span>
                      </Link>
                    )}

                    <Link href="/shops" className={styles.navLink}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path></svg>
                      <span className={styles.navText}>{t('shops')}</span>
                    </Link>

                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                </>
              )}
              <CurrencySelector />
              <LanguageSwitcher />
            </nav>
          </div>
        </div>
      </header>
      {!isHome && (
        <div className={styles.mobileSearchBar}>
          <div className="container">
            <SearchAutocomplete placeholder={t('search')} />
          </div>
        </div>
      )}
    </>
  );
}
