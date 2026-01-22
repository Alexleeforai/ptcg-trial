import { auth } from '@clerk/nextjs/server';
import { getUserCollection } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import { getJpyToHkdRate, convertJpyToHkd } from '@/lib/currency';
import { Link } from '@/lib/navigation';
import styles from './Collection.module.css';
import Card from '@/components/ui/Card';

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
                        {t('browsCards')}
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {collection.map((card) => {
                        const hkdPrice = convertJpyToHkd(card.price || 0, rate);

                        return (
                            <Link
                                key={card.id}
                                href={`/card/${card.id}`}
                                className={styles.cardLink}
                            >
                                <Card className={styles.card}>
                                    <div className={styles.imageWrapper}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={card.image}
                                            alt={card.name}
                                            className={styles.cardImage}
                                        />
                                    </div>
                                    <div className={styles.cardInfo}>
                                        <h3 className={styles.cardName}>{card.name}</h3>
                                        <p className={styles.cardSet}>{card.set}</p>
                                        <div className={styles.priceRow}>
                                            <span className={styles.price}>
                                                ${hkdPrice.toLocaleString()} HKD
                                            </span>
                                            <span className={styles.priceJpy}>
                                                ¥{(card.price || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
