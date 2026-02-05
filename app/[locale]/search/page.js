import { findCards } from '@/lib/db';
import { translateQuery } from '@/lib/translate';
import { getJpyToHkdRate, convertJpyToHkd } from '@/lib/currency';
import { getHighQualityImage } from '@/lib/imageUtils';
import { Link } from '@/lib/navigation';
import Card from '@/components/ui/Card';
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

    let results = await findCards(searchQuery);

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
                        <Link key={card.id} href={`/card/${card.id}`} className={styles.linkItem}>
                            <Card hover className={styles.cardItem}>
                                <div className={styles.imageWrapper}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={getHighQualityImage(card.image)} alt={card.name} className={styles.cardImage} />
                                </div>
                                <div className={styles.cardInfo}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.rarity}>{card.rarity || ''}</span>
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
                                        <span className={styles.price}>
                                            {card.priceRaw && card.currency === 'USD' ? (
                                                <>
                                                    約 ${Math.round(card.priceRaw * 7.8).toLocaleString('en-US')}
                                                    {card.pricePSA10 && (
                                                        <div style={{ fontSize: '0.8em', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            PSA 10: ${Math.round(card.pricePSA10 * 7.8).toLocaleString('en-US')}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    約 ${convertJpyToHkd(card.price || 0, rate).toLocaleString('en-US')}
                                                </>
                                            )}
                                        </span>
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
