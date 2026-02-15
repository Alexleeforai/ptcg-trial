'use client';

import NextLink from 'next/link';
import { Link, usePathname } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySelector from '@/components/ui/CurrencySelector';
import styles from './Header.module.css';
import SearchAutocomplete from '@/components/ui/SearchAutocomplete';

export default function Header() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { user } = useUser();
  const isMerchant = user?.publicMetadata?.role === 'merchant';

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logoIcon}>🎴</span>
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
            <nav className={styles.nav}>
              <SignedOut>
                <Link href="/browse" className={styles.navLink}>
                  <span className={styles.navIcon}>🔍</span>
                  <span className={styles.navText}>{t('browse')}</span>
                </Link>
                <Link href="/shops" className={styles.navLink}>
                  <span className={styles.navIcon}>🏪</span>
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
                  <span className={styles.navIcon}>🔍</span>
                  <span className={styles.navText}>{t('browse')}</span>
                </Link>

                {/* Only Merchants see this */}
                {isMerchant && (
                  <Link href="/merchant" className={styles.merchantLink}>
                    <span className={styles.navText}>Dashboard</span>
                  </Link>
                )}

                {/* Only Users see Collection (Merchants might want it too? Assuming yes only if they buy? But strictly separated accounts usually implies merchants sell.) */}
                {/* User requested strict separation. Let's hide Collection for merchants to reduce clutter if they are "Selling Only" */}
                {/* Actually, merchants might also want to search/browse? Keeping Browse is fine. Collection? maybe not. */}
                {!isMerchant && (
                  <Link href="/collection" className={styles.navLink}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}>
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    <span className={styles.navText}>{t('collection')}</span>
                  </Link>
                )}

                <Link href="/shops" className={styles.navLink}>
                  <span className={styles.navIcon}>🏪</span>
                  <span className={styles.navText}>{t('shops')}</span>
                </Link>

                <UserButton afterSignOutUrl="/" />
              </SignedIn>
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
