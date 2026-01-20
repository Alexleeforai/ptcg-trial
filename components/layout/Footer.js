import { useTranslations } from 'next-intl';
import styles from './Footer.module.css';

export default function Footer() {
    const t = useTranslations('Footer');

    return (
        <footer className={styles.footer}>
            <div className="container">
                <p className={styles.copy}>
                    {t('copy', { year: new Date().getFullYear() })}
                </p>
            </div>
        </footer>
    );
}
