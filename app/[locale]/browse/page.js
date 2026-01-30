import { getBrowseSets } from '@/lib/db';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { getHighQualityImage } from '@/lib/imageUtils';
import styles from './Browse.module.css';

export const revalidate = 3600; // Revalidate every hour

export default async function BrowsePage() {
    const sets = await getBrowseSets();

    return (
        <div className={`container ${styles.container}`}>
            <h1 className={styles.title}>Browse by Set</h1>

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
                                    width={280}
                                    height={390}
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
