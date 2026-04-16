import { getBrowseSets } from '@/lib/db';
import { Link } from '@/lib/navigation';
import SmartImage from '@/components/SmartImage';
import styles from './Browse.module.css';

// export const revalidate = 3600; // Disable static cache for now to debug sorting
export const dynamic = 'force-dynamic'; // Force render on every request

// Use server component but allow searchParams prop
export default async function BrowsePage({ searchParams }) {
    const resolvedParams = await searchParams; // Await params in Next.js 15+
    const sort = resolvedParams?.sort || 'name'; // Default to name
    const language = resolvedParams?.language || 'all'; // Default to all

    // Toggle logic for sort buttons
    const nextNameSort = sort === 'name' ? 'name_desc' : 'name';
    const nextDateSort = sort === 'date' ? 'date_asc' : 'date';
    const nextCountSort = sort === 'count' ? 'count_asc' : 'count';
    const sets = await getBrowseSets(sort, language);

    return (
        <div className={`container ${styles.container}`}>
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
                            href={`/browse?language=japanese&sort=${sort}`}
                            className={`${styles.filterBtn} ${language === 'japanese' ? styles.active : ''}`}
                        >
                            Japanese
                        </Link>
                        <Link
                            href={`/browse?language=english&sort=${sort}`}
                            className={`${styles.filterBtn} ${language === 'english' ? styles.active : ''}`}
                        >
                            English
                        </Link>
                        <Link
                            href={`/browse?language=chinese&sort=${sort}`}
                            className={`${styles.filterBtn} ${language === 'chinese' ? styles.active : ''}`}
                        >
                            Chinese
                        </Link>
                        <Link
                            href={`/browse?language=korean&sort=${sort}`}
                            className={`${styles.filterBtn} ${language === 'korean' ? styles.active : ''}`}
                        >
                            Korean
                        </Link>
                    </div>

                    {/* Sort Options — click again to toggle direction */}
                    <div className={styles.sortOptions}>
                        <Link
                            href={`/browse?language=${language}&sort=${nextNameSort}`}
                            className={`${styles.sortBtn} ${sort === 'name' || sort === 'name_desc' ? styles.active : ''}`}
                        >
                            {sort === 'name_desc' ? 'Z-A' : 'A-Z'}
                        </Link>
                        <Link
                            href={`/browse?language=${language}&sort=${nextDateSort}`}
                            className={`${styles.sortBtn} ${sort === 'date' || sort === 'date_asc' ? styles.active : ''}`}
                        >
                            {sort === 'date_asc' ? 'Oldest' : 'Newest'}
                        </Link>
                        <Link
                            href={`/browse?language=${language}&sort=${nextCountSort}`}
                            className={`${styles.sortBtn} ${sort === 'count' || sort === 'count_asc' ? styles.active : ''}`}
                        >
                            {sort === 'count_asc' ? 'Fewest Cards' : 'Most Cards'}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Horizontal scrolling row of sets */}
            <div className={styles.setsRow} suppressHydrationWarning>
                {sets.map((set) => (
                    <Link
                        href={`/browse/${encodeURIComponent(set.id)}`}
                        key={set.id}
                        className={styles.setCard}
                    >
                        <div className={styles.imageContainer}>
                            <SmartImage
                                src={set.image}
                                alt={set.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className={styles.setImage}
                                style={{ objectFit: 'cover', objectPosition: set.coverImagePosition || '50% 50%' }}
                            />
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
