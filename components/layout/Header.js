'use client';

import { Link, usePathname } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
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
            <Link href="/merchant" className={styles.merchantLink}>{t('merchant')}</Link>
            <LanguageSwitcher />
          </nav>
        </div>
      </div>
    </header>
  );
}
