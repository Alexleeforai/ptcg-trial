'use client';

import Link from 'next/link';
import styles from './LatestSets.module.css';

export default function LatestSets({ sets }) {
    if (!sets || sets.length === 0) return null;

    return (
        <div className={styles.section}>
            <h2 className={styles.title}>Latest Card Sets</h2>
            <div className={styles.grid}>
                {sets.map(set => (
                    <div key={set.id} className={styles.setCard}>
                        <div className={styles.imageWrapper}>
                            {/* Use Set Name as fallback for logo if image fails or is placeholder */}
                            <div className={styles.setLogoPlaceholder}>{set.baseSet}</div>
                        </div>
                        <div className={styles.setInfo}>
                            <h3 className={styles.setName}>{set.name}</h3>
                            <span className={styles.releaseDate}>{set.releaseDate}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
