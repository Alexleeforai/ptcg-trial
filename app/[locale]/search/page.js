import { searchCards } from '@/lib/data';
import { Link } from '@/lib/navigation';
import Card from '@/components/ui/Card';
import styles from './Search.module.css';
import { getTranslations } from 'next-intl/server';

// Re-validate data reasonably often
export const revalidate = 60;

export default async function SearchPage({ searchParams }) {
    const params = await searchParams;
    const q = params.q || '';
    const results = await searchCards(q);
    const t = await getTranslations('Search');

    return (
        <div className="container" style={{ padding: '40px 1rem' }}>
            <h1 className={styles.heading}>
                {t('resultsFor')} <span className="text-gradient">"{q}"</span>
            </h1>

            {results.length === 0 ? (
                <div className={styles.noResults}>
                    <p>{t('noResults')} "{q}".</p>
                    <p className={styles.suggestion}>{t('suggestion')}</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {results.map((card) => (
                        <Link key={card.id} href={`/card/${card.id}`}>
                            <Card hover className={styles.cardItem}>
                                <div className={styles.imageWrapper}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={card.image} alt={card.name} className={styles.cardImage} />
                                </div>
                                <div className={styles.cardInfo}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.rarity}>{card.rarity}</span>
                                        <span className={styles.set}>{card.set}</span>
                                    </div>
                                    <h3 className={styles.cardName}>{card.name}</h3>
                                    {(card.nameCN || card.nameEN) && (
                                        <div className={styles.subNames}>
                                            {card.nameCN && <span>{card.nameCN}</span>}
                                            {card.nameCN && card.nameEN && <span className={styles.separator}>/</span>}
                                            {card.nameEN && <span>{card.nameEN}</span>}
                                        </div>
                                    )}
                                    <div className={styles.priceInfo}>
                                        <span className={styles.label}>{t('basePrice')}</span>
                                        <span className={styles.price}>¥{card.basePriceJPY.toLocaleString()}</span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
