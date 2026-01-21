'use client';

import { usePathname, useRouter } from '@/lib/navigation';
import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import styles from './LanguageSwitcher.module.css';

const locales = [
    { code: 'en', label: 'EN' },
    { code: 'zh-HK', label: '繁' },
    { code: 'zh-CN', label: '简' },
    { code: 'ja', label: 'JP' }
];

export default function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const activeLocale = useLocale();
    const [isPending, startTransition] = useTransition();

    const switchLocale = (nextLocale) => {
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <div className={styles.switcher}>
            {locales.map((l) => (
                <button
                    key={l.code}
                    onClick={() => switchLocale(l.code)}
                    disabled={isPending}
                    className={`${styles.button} ${activeLocale === l.code ? styles.active : ''}`}
                >
                    {l.label}
                </button>
            ))}
        </div>
    );
}
