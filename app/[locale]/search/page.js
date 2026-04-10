import { findCards } from '@/lib/db';
import { translateQuery } from '@/lib/translate';
import { getJpyToHkdRate, convertJpyToHkd } from '@/lib/currency';
import { getHighQualityImage } from '@/lib/imageUtils';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import QuickActionBookmark from '@/components/card/QuickActionBookmark';
import SortFilter from '@/components/search/SortFilter';
import styles from './Search.module.css';
import { getTranslations } from 'next-intl/server';

// Re-validate data reasonably often
export const revalidate = 60;

// Sort function
function sortResults(results, sortBy) {
    const sorted = [...results];

    // Helper to get comparable price (convert USD to HKD for fair comparison)
    const getPrice = (card) => {
        if (card.priceRaw && card.currency === 'USD') {
            return card.priceRaw * 7.8; // USD to HKD
        }
        return card.price || 0;
    };

    switch (sortBy) {
        case 'price-desc':
            return sorted.sort((a, b) => getPrice(b) - getPrice(a));
        case 'price-asc':
            return sorted.sort((a, b) => getPrice(a) - getPrice(b));
        case 'name-asc':
            return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        case 'name-desc':
            return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        case 'date-desc':
            return sorted.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        case 'date-asc':
            return sorted.sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0));
        default:
            return sorted.sort((a, b) => getPrice(b) - getPrice(a));
    }
}

export default async function SearchPage({ searchParams }) {
    const params = await searchParams;
    const q = params.q || '';
    const sort = params.sort || 'price-desc';
    const type = params.type || 'all';

    const rate = await getJpyToHkdRate();

    // Translate Chinese query to English if needed
    const translatedQ = translateQuery(q);

    let searchQuery;
    // If it contains | (Charizard|Flareon), treat as Regex
    if (translatedQ.includes('|')) {
        searchQuery = new RegExp(translatedQ, 'i');
    } else {
        searchQuery = translatedQ;
    }

    let results = await findCards(searchQuery, type);

    // Apply sorting
    results = sortResults(results, sort);

    const t = await getTranslations('Search');

    return (
        <div className="container" style={{ padding: '40px 1rem' }}>
            <h1 className={styles.heading}>
                {t('resultsFor')} <span className="text-gradient">"{q}"</span>
            </h1>

            {results.length > 0 && <SortFilter />}

            {results.length === 0 ? (
                <div className={styles.noResults}>
                    <p>{t('noResults')} "{q}".</p>
                    <p className={styles.suggestion}>{t('suggestion')}</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {results.map((card) => (
                        <div key={card.id} className={styles.linkItem} style={{ position: 'relative' }}>
                            <QuickActionBookmark cardId={card.id} />
                            <Link href={`/card/${card.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                                <Card hover className={styles.cardItem}>
                                    <div className={styles.imageWrapper}>
                                        <Image
                                            src={getHighQualityImage(card.image) || '/placeholder-card.png'}
                                            alt={card.name || 'Unknown Card'}
                                            width={240}
                                            height={336}
                                            className={styles.cardImage}
                                        />
                                    </div>
                                    <div className={styles.cardInfo}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.rarity}>{card.rarity || ''}</span>
                                        </div>
                                        <h3 className={styles.cardName}>{card.name}</h3>
                                        <div className={styles.setRow}>{card.set}</div>
                                        {card.cardType && (
                                            <div className={styles.typeBlock}>({card.cardType.toLowerCase()})</div>
                                        )}
                                        <div className={styles.priceInfo}>
                                            <div className={styles.priceRow}>
                                                <span className={styles.priceLabel}>Raw</span>
                                                <span className={styles.price}>
                                                    HK${card.priceRaw && card.currency === 'USD' 
                                                        ? Math.round(parseFloat(card.priceRaw) * 7.8).toLocaleString() 
                                                        : Math.round(convertJpyToHkd(parseFloat(card.price) || 0, rate)).toLocaleString()}
                                                </span>
                                            </div>
                                            {card.pricePSA10 > 0 && (
                                                <div className={styles.priceRow}>
                                                    <span className={styles.priceLabel}>PSA 10</span>
                                                    <span className={styles.price}>
                                                        HK${Math.round(parseFloat(card.pricePSA10) * 7.8).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
