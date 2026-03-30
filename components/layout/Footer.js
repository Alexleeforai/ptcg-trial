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
                    {' · '}
                    <Link href="/disclaimer" className={styles.disclaimerLink}>免責聲明</Link>
                </p>
            </div>
        </footer>
    );
}
