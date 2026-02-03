'use client';

import { usePathname, useRouter } from '@/lib/navigation';
import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import styles from './LanguageSwitcher.module.css';

const locales = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'zh-HK', label: '繁', name: '繁體中文' },
    { code: 'zh-CN', label: '简', name: '简体中文' },
    { code: 'ja', label: 'JP', name: '日本語' }
];

export default function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const activeLocale = useLocale();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);

    const switchLocale = (nextLocale) => {
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
        setIsOpen(false);
    };

    const currentLocale = locales.find(l => l.code === activeLocale) || locales[0];

    return (
        <div className={styles.switcher}>
            <button
                className={styles.button}
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                aria-label="Select language"
            >
                <span className={styles.label}>{currentLocale.label}</span>
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    {locales.map((l) => (
                        <button
                            key={l.code}
                            className={`${styles.option} ${activeLocale === l.code ? styles.active : ''}`}
                            onClick={() => switchLocale(l.code)}
                            disabled={isPending}
                        >
                            <span className={styles.optionLabel}>{l.label}</span>
                            <span className={styles.optionName}>{l.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
