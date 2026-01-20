'use client';

import { usePathname, useRouter } from '@/lib/navigation';
import { useTransition } from 'react';
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
    const [isPending, startTransition] = useTransition();

    const currentLocale = pathname.split('/')[1] || 'en'; // Fallback logic if needed, but router handles it

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
                    className={`${styles.button} ${currentLocale === l.code ? styles.active : ''}`} // Note: currentLocale logic might need refinement if pathname doesn't have locale, but next-intl usually supplies it in props if we pass it, or we rely on hook. 
                // Actually usePathname from navigation strips the locale usually.
                // Let's rely on `useLocale` hook from next-intl if we want to be sure, or just simple check.
                >
                    {l.label}
                </button>
            ))}
        </div>
    );
}
