import { getCardById, getListingsByCardId, getTrendData } from '@/lib/data';
import styles from './CardDetail.module.css';
import TrendChart from '@/components/card/TrendChart';
import TCGPlayerPrice from '@/components/card/TCGPlayerPrice';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import RecentlyViewedTracker from '@/components/card/RecentlyViewedTracker';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';

export default async function CardDetailPage({ params }) {
    const { id } = await params;
    const card = await getCardById(id);
    const t = await getTranslations('CardDetail');


    if (!card) {
        return <div className="container">{t('notFound')}</div>;
    }

    const listings = await getListingsByCardId(id);
    const trendData = await getTrendData(id);

    // Exchange rate assumption: 100 JPY = 5.2 HKD
    const hkdBenchmark = Math.round(card.basePriceJPY * 0.052);

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
                        <span className={styles.setInfo}>{card.set} • {card.number}</span>
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
                            <span className={styles.curr}>¥</span>{card.basePriceJPY.toLocaleString()}
                            <span className={styles.approx}>≈ HK${hkdBenchmark}</span>
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
                        {t('disclaimer')}
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
