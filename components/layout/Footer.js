'use client';

import Link from 'next/link';
import styles from './Footer.module.css';
import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('Footer');

    return (
        <footer className={styles.footer}>
            <div className="container">
                <p className={styles.copy}>
                    {t('copy', { year: new Date().getFullYear() })}
                </p>
                <div className={styles.legalLinks}>
                    <Link href="/disclaimer" className={styles.legalLink}>免責聲明</Link>
                    <span className={styles.dot}>·</span>
                    <Link href="/tos" className={styles.legalLink}>服務條款</Link>
                    <span className={styles.dot}>·</span>
                    <Link href="/privacy" className={styles.legalLink}>私隱政策</Link>
                    <span className={styles.dot}>·</span>
                    <Link href="/external-links" className={styles.legalLink}>外部連結聲明</Link>
                </div>
            </div>
        </footer>
    );
}
