import { auth } from '@clerk/nextjs/server';
import { getUserCollection } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import { getJpyToHkdRate, convertJpyToHkd } from '@/lib/currency';
import { getHighQualityImage } from '@/lib/imageUtils';
import { Link } from '@/lib/navigation';
import styles from './Collection.module.css';
import CollectionCard from '@/components/collection/CollectionCard';

// Revalidate every 5 minutes
export const revalidate = 300;

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

    const collection = await getUserCollection(userId);

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
                <div className={styles.grid}>
                    {collection.map((card) => (
                        <CollectionCard
                            key={card.id}
                            cardId={card.id}
                            name={card.name}
                            image={card.image}
                            set={card.set}
                            priceJpy={card.price}
                            priceRawUsd={card.priceRaw}
                            pricePSA10={card.pricePSA10} // Pass PSA10
                            currency={card.currency}
                            rate={rate}
                            initialPurchasePrice={card.purchasePrice}
                            items={card.items} // Pass items
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
