import { findCards } from '@/lib/db';
import SetMetadata from '@/models/SetMetadata';
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
    const langParam = params.lang || 'all';
    const cardTypeParam = params.cardType || 'all';

    // Translate Chinese query to English if needed
    const translatedQ = translateQuery(q);

    let searchQuery;
    if (translatedQ.includes('|')) {
        searchQuery = new RegExp(translatedQ, 'i');
    } else {
        searchQuery = translatedQ;
    }

    const [rate, t, rawResults, metaDocs] = await Promise.all([
        getJpyToHkdRate(),
        getTranslations('Search'),
        findCards(searchQuery, type),
        SetMetadata.find({}).lean().catch(() => [])
    ]);

    const metaMap = {};
    metaDocs.forEach(m => {
        metaMap[m.setId] = m;
    });

    function resolveLanguage(setId, setName) {
        const meta = metaMap[setId];
        if (meta && meta.language) return meta.language;
        const n = setName || '';
        if (/japanese/i.test(n)) return 'japanese';
        if (/chinese|traditional|simplified/i.test(n)) return 'chinese';
        if (/korean/i.test(n)) return 'korean';
        return 'english';
    }

    let results = rawResults.filter(card => {
        if (langParam !== 'all') {
            const cardLang = resolveLanguage(card.setId || card.set, card.set);
            if (cardLang !== langParam) return false;
        }

        if (cardTypeParam !== 'all') {
            const ct = (card.cardType || 'single').toLowerCase();
            if (cardTypeParam === 'single') {
                if (ct !== 'single' && ct !== 'single card') return false;
            } else if (cardTypeParam === 'box') {
                if (!ct.includes('box') && !ct.includes('pack') && !ct.includes('set') && !ct.includes('sealed')) return false;
            }
        }
        return true;
    });

    // Apply sorting
    results = sortResults(results, sort);

    return (
        <div className="container" style={{ padding: '40px 1rem' }}>
            <h1 className={styles.heading}>
                {t('resultsFor')} <span className="text-gradient">"{q}"</span>
            </h1>

            {rawResults.length > 0 && <SortFilter />}

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
