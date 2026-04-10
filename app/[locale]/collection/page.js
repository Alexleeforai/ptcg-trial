import { auth } from '@clerk/nextjs/server';
import { getUserCollection } from '@/lib/db';
import SetMetadata from '@/models/SetMetadata';
import connectToDatabase from '@/lib/mongodb';
import { getTranslations } from 'next-intl/server';
import { getJpyToHkdRate, convertJpyToHkd } from '@/lib/currency';
import { getHighQualityImage } from '@/lib/imageUtils';
import { Link } from '@/lib/navigation';
import styles from './Collection.module.css';
import CollectionView from '@/components/collection/CollectionView';

// Collection is personal user data — must never be cached across users
export const dynamic = 'force-dynamic';

export default async function CollectionPage() {
    const { userId } = await auth();
    const t = await getTranslations('Collection');
    const rate = await getJpyToHkdRate();

    if (!userId) {
        // This shouldn't happen due to middleware protection, but just in case
        return (
            <div className="container">
                <p>{t('unauthorized')}</p>
            </div>
        );
    }

    // Fetch both collection and metadata
    await connectToDatabase();
    const [collection, metaDocs] = await Promise.all([
        getUserCollection(userId),
        SetMetadata.find({}).lean()
    ]);

    const metaMap = {};
    metaDocs.forEach(m => {
        metaMap[m.setId] = {
            setId: m.setId,
            language: m.language || ''
        };
    });

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('title')}</h1>
                <p className={styles.subtitle}>{t('subtitle')}</p>
            </div>

            {collection.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📚</div>
                    <h2>{t('empty')}</h2>
                    <p>{t('emptyHint')}</p>
                    <Link href="/" className={styles.browseButton}>
                        {t('browseCards')}
                    </Link>
                </div>
            ) : (
                <CollectionView 
                    collection={collection} 
                    rate={rate} 
                    metaMap={metaMap} 
                />
            )}
        </div>
    );
}
