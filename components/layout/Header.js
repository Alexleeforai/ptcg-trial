'use client';

import { Link, usePathname } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './Header.module.css';
import SearchAutocomplete from '@/components/ui/SearchAutocomplete';

export default function Header() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
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
              <Link href="/merchant" className={styles.merchantLink}>{t('merchant')}</Link>
            </SignedOut>
            <SignedIn>
              <Link href="/collection" className={styles.navLink}>
                <span className={styles.navIcon}>📚</span>
                <span className={styles.navText}>{t('collection')}</span>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <LanguageSwitcher />
          </nav>
        </div>
      </div>
    </header>
  );
}
