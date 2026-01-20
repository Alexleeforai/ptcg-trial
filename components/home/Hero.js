'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import styles from './Hero.module.css';
import Button from '@/components/ui/Button';
import SearchAutocomplete from '@/components/ui/SearchAutocomplete';

export default function Hero() {
    const t = useTranslations('Hero');
    const router = useRouter(); // Keep router if SearchAutocomplete needs it or for other parts of Hero

    return (
        <section className={styles.hero}>
            <div className={styles.content}>
                <h1
                    className={styles.title}
                    dangerouslySetInnerHTML={{ __html: t.raw('title') }}
                />
                <p className={styles.subtitle}>
                    {t('subtitle')}
                </p>

                <div className={styles.searchForm}>
                    <SearchAutocomplete
                        placeholder={t('searchPlaceholder')}
                        className={styles.heroSearchInput}
                        router={router}
                    />
                </div>
            </div>

            <div className={styles.backgroundGlow} />
        </section>
    );
}
