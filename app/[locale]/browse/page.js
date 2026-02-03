import { getBrowseSets } from '@/lib/db';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { getHighQualityImage } from '@/lib/imageUtils';
import styles from './Browse.module.css';

// export const revalidate = 3600; // Disable static cache for now to debug sorting
export const dynamic = 'force-dynamic'; // Force render on every request

// Use server component but allow searchParams prop
export default async function BrowsePage({ searchParams }) {
    const resolvedParams = await searchParams; // Await params in Next.js 15+
    const sort = resolvedParams?.sort || 'name'; // Default to name
    const language = resolvedParams?.language || 'all'; // Default to all
    const sets = await getBrowseSets(sort, language);

    return (
        <div key={`browse-${language}-${sort}`} className={`container ${styles.container}`}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>Browse Sets 🗂️</h1>

                <div className={styles.controls}>
                    {/* Language Filter */}
                    <div className={styles.filterGroup}>
                        <Link
                            href={`/browse?language=all&sort=${sort}`}
                            className={`${styles.filterBtn} ${language === 'all' ? styles.active : ''}`}
                        >
                            All
                        </Link>
                        <Link
                            href={`/browse?language=english&sort=${sort}`}
                            className={`${styles.filterBtn} ${language === 'english' ? styles.active : ''}`}
                        >
                            English
                        </Link>
                        <Link
                            href={`/browse?language=japanese&sort=${sort}`}
                            className={`${styles.filterBtn} ${language === 'japanese' ? styles.active : ''}`}
                        >
                            Japanese
                        </Link>
                        <Link
                            href={`/browse?language=chinese&sort=${sort}`}
                            className={`${styles.filterBtn} ${language === 'chinese' ? styles.active : ''}`}
                        >
                            Chinese
                        </Link>
                    </div>

                    {/* Sort Options */}
                    <div className={styles.sortOptions}>
                        <Link href={`/browse?language=${language}&sort=name`} className={`${styles.sortBtn} ${sort === 'name' ? styles.active : ''}`}>
                            A-Z
                        </Link>
                        <Link href={`/browse?language=${language}&sort=date`} className={`${styles.sortBtn} ${sort === 'date' ? styles.active : ''}`}>
                            Newest
                        </Link>
                        <Link href={`/browse?language=${language}&sort=count`} className={`${styles.sortBtn} ${sort === 'count' ? styles.active : ''}`}>
                            Most Cards
                        </Link>
                    </div>
                </div>
            </div>

            {/* Horizontal scrolling row of sets */}
            <div className={styles.setsRow}>
                {sets.map((set) => (
                    <Link
                        href={`/browse/${encodeURIComponent(set.id)}`}
                        key={set.id}
                        className={styles.setCard}
                    >
                        <div className={styles.imageContainer}>
                            {set.image ? (
                                <Image
                                    src={getHighQualityImage(set.image)}
                                    alt={set.name}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    quality={95}
                                    className={styles.setImage}
                                />
                            ) : (
                                <div className={styles.placeholder}>No Image</div>
                            )}
                        </div>
                        <div className={styles.setInfo}>
                            <h3 className={styles.setName}>{set.name}</h3>
                            <p className={styles.setCount}>{set.count} Cards</p>
                        </div>
                    </Link>
                ))}
            </div>

            {sets.length === 0 && (
                <div className={styles.empty}>
                    No sets found. Database might be updating.
                </div>
            )}
        </div>
    );
}
