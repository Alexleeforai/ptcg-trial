'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './SortFilter.module.css';

const SORT_OPTIONS = [
    { value: 'number-asc', label: '編號 (Card Number)' },
    { value: 'price-desc', label: '價格 高→低' },
    { value: 'price-asc', label: '價格 低→高' },
    { value: 'name-asc', label: '名稱 A→Z' },
    { value: 'name-desc', label: '名稱 Z→A' }
];

const LANG_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'japanese', label: '日文' },
    { value: 'english', label: 'English' },
    { value: 'chinese', label: '中文' },
    { value: 'korean', label: '韓國' }
];

const TYPE_OPTIONS = [
    { value: 'all', label: 'All Types' },
    { value: 'single', label: 'Single Card' },
    { value: 'box', label: 'Box / Set' }
];

export default function SortFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get('sort') || 'price-desc';
    const currentLang = searchParams.get('lang') || 'all';
    const currentCardType = searchParams.get('cardType') || 'all';

    const handleParamChange = (key, value) => {
        const params = new URLSearchParams(searchParams);
        params.set(key, value);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className={styles.filterContainer}>
            {/* Action Row: Sort Dropdown */}
            <div className={styles.topRow}>
                <label className={styles.label}>排序：</label>
                <select
                    className={styles.select}
                    value={currentSort}
                    onChange={(e) => handleParamChange('sort', e.target.value)}
                >
                    {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Language Filters */}
            <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>語系：</span>
                <div className={styles.buttonGroup}>
                    {LANG_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            className={`${styles.filterBtn} ${currentLang === opt.value ? styles.active : ''}`}
                            onClick={() => handleParamChange('lang', opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Type Filters */}
            <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>產品：</span>
                <div className={styles.buttonGroup}>
                    {TYPE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            className={`${styles.filterBtn} ${currentCardType === opt.value ? styles.active : ''}`}
                            onClick={() => handleParamChange('cardType', opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
