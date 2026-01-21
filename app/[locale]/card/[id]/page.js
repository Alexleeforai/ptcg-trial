import { getCardById, upsertCards } from '@/lib/db';
import { getSnkrdunkCard } from '@/lib/snkrdunk';
import styles from './CardDetail.module.css';
import TrendChart from '@/components/card/TrendChart';
import TCGPlayerPrice from '@/components/card/TCGPlayerPrice';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import RecentlyViewedTracker from '@/components/card/RecentlyViewedTracker';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { getJpyToHkdRate, convertJpyToHkd } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export default async function CardDetailPage({ params }) {
    const { id } = await params;
    console.log(`[CardPage] Loading ID: ${id}`);

    let card = getCardById(id);
    console.log(`[CardPage] DB Result for ${id}:`, card ? 'Found' : 'Not Found');
    const t = await getTranslations('CardDetail');
    const rate = await getJpyToHkdRate();

    // Check Staleness (4 hours)
    if (card) {
        const updatedAt = new Date(card.updatedAt || 0).getTime();
        const now = Date.now();
        const diffHours = (now - updatedAt) / (1000 * 60 * 60);

        if (diffHours > 4) {
            console.log(`[CardPage] Data stale (${diffHours.toFixed(1)}h old) for ${id}. Refreshing...`);
            try {
                // Determine SNKRDUNK ID
                // If ID is snkr-XXXX, extract XXXX. If just numbers, use as is?
                // Our IDs are mostly snkr-XXXX.
                const snkrdunkId = id.startsWith('snkr-') ? id.replace('snkr-', '') : id; // What if it's 'sv1-001'? We assume scrape logic handles snkr ids primarily.

                // Only try to rescrape if it LOOKS like a snkrdunk ID (number or snkr-number)
                // Actually, our custom scrape logic in lib/snkrdunk uses ID to fetch URL? 
                // getSnkrdunkCard constructs URL: https://snkrdunk.com/en/trading-cards/${snkrdunkId}
                // So we need the numeric ID.
                // Our DB IDs are usually snkr-12345.

                if (id.startsWith('snkr-') || !isNaN(id)) {
                    const scrapedCard = await getSnkrdunkCard(snkrdunkId);
                    if (scrapedCard) {
                        console.log(`[CardPage] Refresh successful for ${id}`);
                        // Update in-memory card object for this render
                        // Preserve some fields? Scrape returns full object.
                        // We should merge to keep things like 'createdAt' if we cared, but scrape is fresh.
                        card = { ...card, ...scrapedCard };

                        // Attempt to update DB (Ephemeral on Vercel, Persistent on Local)
                        upsertCards([scrapedCard]);
                    }
                }
            } catch (e) {
                console.error("Stale refresh failed:", e);
            }
        }
    }

    // Fallback: If not in DB, try to scrape it live (for snkr- IDs)
    if (!card && id.startsWith('snkr-')) {
        const snkrdunkId = id.replace('snkr-', '');
        console.log(`[CardPage] Attempting fallback scrape for ${snkrdunkId}`);
        try {
            const scrapedCard = await getSnkrdunkCard(snkrdunkId);
            if (scrapedCard) {
                console.log(`[CardPage] Scrape successful for ${snkrdunkId}`);
                upsertCards([scrapedCard]);
                card = scrapedCard;
            } else {
                console.log(`[CardPage] Scrape returned null for ${snkrdunkId}`);
            }
        } catch (e) {
            console.error("Fallback scrape failed:", e);
        }
    }

    if (!card) {
        return <div className="container">{t('notFound')}</div>;
    }

    // Listings and trend data not yet implemented
    // Listings and trend data
    const listings = [];

    // Convert history to trend data (JPY -> HKD)
    // If no history, we might want to pretend we have at least one point (current)
    const rawHistory = card.priceHistory || [];
    // If history is empty but we have current price, maybe push current?
    // Actually TrendChart handles empty.

    const trendData = rawHistory.map(h => ({
        date: h.date,
        price: convertJpyToHkd(h.price, rate)
    }));

    // If we have no history but we have a current price, show it as a single point?
    if (trendData.length === 0 && card.price) {
        trendData.push({
            date: new Date().toISOString().split('T')[0],
            price: convertJpyToHkd(card.price, rate)
        });
    }

    // Exchange rate assumption: Dynamic
    // Use card.price (from SNKRDUNK)
    const price = card.price || 0;
    const hkdBenchmark = convertJpyToHkd(price, rate);

    const sellListings = listings.filter(l => l.type === 'sell');
    const buyListings = listings.filter(l => l.type === 'buy');

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.topSection}>
                <div className={styles.imageColumn}>
                    <div className={styles.cardWrapper}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={card.image} alt={card.name} className={styles.mainImage} />
                    </div>
                </div>

                <div className={styles.infoColumn}>
                    <div className={styles.header}>
                        <div className={styles.metaRow}>
                            <span className={styles.setInfo}>{card.set} • {card.number}</span>
                            {card.releaseDate && (
                                <span style={{ marginLeft: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Released: {card.releaseDate}
                                </span>
                            )}
                        </div>
                        <h1 className={styles.title}>{card.name}</h1>
                        <h2 className={styles.subTitle}>
                            {card.nameCN && <span>{card.nameCN}</span>}
                            {card.nameCN && card.nameEN && <span style={{ margin: '0 8px' }}>/</span>}
                            {card.nameEN && <span>{card.nameEN}</span>}
                            {/* If no translation, show nothing or just JP again? Title is JP. */}
                        </h2>
                    </div>

                    <Card className={styles.benchmarkCard}>
                        <div className={styles.benchmarkLabel}>{t('benchmark')}</div>
                        <div className={styles.benchmarkPrice}>
                            <span className={styles.priceValue}>
                                約 ${hkdBenchmark.toLocaleString()}
                                <span className={styles.priceOriginal}>
                                    (¥{price.toLocaleString()})
                                </span>
                            </span>

                        </div>
                        <div className={styles.trendRow}>
                            <TrendChart data={trendData} />
                        </div>
                        <TCGPlayerPrice
                            cardName={card.name}
                            setName={card.set}
                            cardNumber={card.number}
                        />
                    </Card>

                    <p className={styles.disclaimer}>
                        {t('disclaimer')} (Rate: {rate})
                    </p>
                </div>
            </div>

            <div className={styles.listingsSection}>
                <h3 className={styles.sectionTitle}>Shop Quotations</h3>

                <div className={styles.tablesGrid}>
                    {/* Selling Listings (Where to Buy) */}
                    <div className={styles.tableColumn}>
                        <h4 className={`${styles.tableTitle} ${styles.typeSell}`}>
                            <span className={styles.icon}>🛒</span> {t('buyFromShops')}
                        </h4>
                        {sellListings.length === 0 ? (
                            <p className={styles.empty}>{t('emptyBuy')}</p>
                        ) : (
                            <div className={styles.listingsList}>
                                {sellListings.map(l => (
                                    <ListingItem key={l.id} listing={l} t={t} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Buying Listings (Where to Sell) */}
                    <div className={styles.tableColumn}>
                        <h4 className={`${styles.tableTitle} ${styles.typeBuy}`}>
                            <span className={styles.icon}>💰</span> {t('sellToShops')}
                        </h4>
                        {buyListings.length === 0 ? (
                            <p className={styles.empty}>{t('emptySell')}</p>
                        ) : (
                            <div className={styles.listingsList}>
                                {buyListings.map(l => (
                                    <ListingItem key={l.id} listing={l} t={t} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Client-side logic to track view */}
            <RecentlyViewedTracker card={card} />
        </div>
    );
}

function ListingItem({ listing, t }) {
    const { shop, price, condition, updatedAt, type, stock } = listing;
    const isSell = type === 'sell';

    return (
        <div className={styles.listingItem}>
            <div className={styles.shopInfo}>
                <div className={styles.shopName}>{shop.name}</div>
                <div className={styles.shopMeta}>{shop.location} • {condition} Rank</div>
            </div>
            <div className={styles.actionColumn}>
                <div className={`${styles.priceTag} ${isSell ? styles.sellColors : styles.buyColors}`}>
                    HK${price}
                </div>
                <Button size="sm" variant={isSell ? 'primary' : 'secondary'}>
                    {isSell ? t('whatsapp') : t('offer')}
                </Button>
            </div>
        </div>
    );
}
