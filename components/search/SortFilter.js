'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './SortFilter.module.css';

const SORT_OPTIONS = [
    { value: 'number-asc', label: '編號 (Card Number)' },
    { value: 'price-desc', label: '價格 高→低' },
    { value: 'price-asc', label: '價格 低→高' },
    { value: 'name-asc', label: '名稱 A→Z' },
    { value: 'name-desc', label: '名稱 Z→A' },
    { value: 'date-desc', label: '最新優先' },
    { value: 'date-asc', label: '最舊優先' }
];

export default function SortFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get('sort') || 'price-desc';
    const currentQuery = searchParams.get('q') || '';

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        const params = new URLSearchParams(searchParams);
        params.set('sort', newSort);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className={styles.filterBar}>
            <label className={styles.label}>排序：</label>
            <select
                className={styles.select}
                value={currentSort}
                onChange={handleSortChange}
            >
                {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
