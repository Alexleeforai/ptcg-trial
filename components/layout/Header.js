'use client';

import { useState, useEffect, useRef } from 'react';
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { user } = useUser();
  const isMerchant = mounted && user?.publicMetadata?.role === 'merchant';
  const isAdmin = mounted && user?.publicMetadata?.role === 'admin';
  const showCollection = !mounted || !isMerchant;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const triggerRef = useRef(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (
        sidebarRef.current && !sidebarRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      {/* ── Hamburger trigger strip on the left edge ── */}
      <div
        ref={triggerRef}
        className={styles.hamburgerTrigger}
        onClick={() => setSidebarOpen(v => !v)}
        aria-label="Open navigation"
      >
        <span className={styles.hamburgerIcon}>
          <span /><span /><span />
        </span>
      </div>

      {/* ── Sidebar ── */}
      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        {/* Brand */}
        <Link href="/" className={styles.brand} onClick={() => setSidebarOpen(false)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.logoIcon}>
            <rect x="2" y="6" width="14" height="15" rx="2" ry="2"></rect>
            <rect x="8" y="3" width="14" height="15" rx="2" ry="2"></rect>
          </svg>
          <span className={styles.brandName}>{t('brand')}</span>
        </Link>

        <div className={styles.sidebarDivider} />

        {/* Nav items */}
        <nav className={styles.sidebarNav}>
          {mounted && (
            <>
              <SignedOut>
                <SideLink href="/browse" onClick={() => setSidebarOpen(false)} styles={styles}>
                  <BrowseIcon /> {t('browse')}
                </SideLink>
                <SideLink href="/shops" onClick={() => setSidebarOpen(false)} styles={styles}>
                  <ShopIcon /> {t('shops')}
                </SideLink>
                <NextLink href="/sign-in" className={styles.sideLink} onClick={() => setSidebarOpen(false)}>Login</NextLink>
                <Link href="/sign-up" className={styles.sideLink} onClick={() => setSidebarOpen(false)}>Register</Link>
              </SignedOut>

              <SignedIn>
                <SideLink href="/browse" onClick={() => setSidebarOpen(false)} styles={styles}>
                  <BrowseIcon /> {t('browse')}
                </SideLink>

                {isMerchant && (
                  <SideLink href="/merchant" onClick={() => setSidebarOpen(false)} styles={styles} highlight>
                    我的店舖
                  </SideLink>
                )}

                {isAdmin && (
                  <SideLink href="/admin/verifications" onClick={() => setSidebarOpen(false)} styles={styles} admin>
                    Admin Panel
                  </SideLink>
                )}

                {showCollection && (
                  <SideLink href="/collection" onClick={() => setSidebarOpen(false)} styles={styles}>
                    <HeartIcon /> {t('collection')}
                  </SideLink>
                )}

                <SideLink href="/shops" onClick={() => setSidebarOpen(false)} styles={styles}>
                  <ShopIcon /> {t('shops')}
                </SideLink>

                <div className={styles.sidebarDivider} />
                <div className={styles.userRow}>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </>
          )}
        </nav>

        <div className={styles.sidebarBottom}>
          <CurrencySelector />
          <LanguageSwitcher />
        </div>
      </aside>

      {/* ── Overlay backdrop ── */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Slim top bar: only logo + search + mobile drawer ── */}
      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.headerRight}>
            <MobileNavDrawer />
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

// ── Small helper components ──
function SideLink({ href, onClick, styles, children, highlight, admin }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${styles.sideLink} ${highlight ? styles.sideLinkHighlight : ''} ${admin ? styles.sideLinkAdmin : ''}`}
    >
      {children}
    </Link>
  );
}

function BrowseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
      <path d="M2 7h20"></path>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
