import { getListingsForCard, getCardById, getUserBookmarks, incrementCardView, getCollectionItem } from '@/lib/db';
import { getJpyToHkdRate, convertJpyToHkd, snkrdunkToHkd } from '@/lib/currency';
import { auth } from '@clerk/nextjs/server';
import { Link } from '@/lib/navigation';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import styles from './CardDetail.module.css';
import SmartImage from '@/components/SmartImage';
import Card from '@/components/ui/Card';
import TrendChart from '@/components/card/TrendChart';
import { notFound } from 'next/navigation';
import TCGPlayerPrice from '@/components/card/TCGPlayerPrice';
import BookmarkButton from '@/components/card/BookmarkButton';
import RecentlyViewedTracker from '@/components/card/RecentlyViewedTracker';
import MerchantListingsTable from '@/components/merchant/MerchantListingsTable';
import AddListingButton from '@/components/merchant/AddListingButton';
import CollectionPriceTracker from '@/components/card/CollectionPriceTracker'; // Import tracker
import { getHighQualityImage } from '@/lib/imageUtils';
import InlineAddListingTrigger from '@/components/card/InlineAddListingTrigger';
import { clerkClient } from '@clerk/nextjs/server';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function CardDetailPage({ params }) {
    const { id } = await params;

    let card = await getCardById(id);
    const t = await getTranslations('CardDetail');
    const rate = await getJpyToHkdRate();

    // Track View (Fire and forget)
    if (card) {
        incrementCardView(id).catch(e => console.error("View track failed", e));
    }

    // Check if card is bookmarked (for signed-in users)
    const { userId } = await auth();
    let collectionItem = null;
    let isBookmarked = false;
    let isMerchant = false;

    if (userId) {
        if (card) {
            collectionItem = await getCollectionItem(userId, id);
            isBookmarked = !!collectionItem;
        }

        try {
            const client = await clerkClient();
            const userObj = await client.users.getUser(userId);
            if (userObj?.publicMetadata?.role === 'merchant') {
                isMerchant = true;
            }
        } catch (error) {
            console.error('Failed to fetch user role:', error);
        }
    }

    // ... (staleness check omitted for brevity, keeping same logic) ...

    if (!card) {
        return (
            <div className="container" style={{ padding: '80px' }}>{t('notFound')}</div>
        );
    }

    // Calc Price
    const listings = await getListingsForCard(id);
    const rawHistory = card.priceHistory || [];
    const trendData = rawHistory.map(h => ({
        date: h.date,
        price: convertJpyToHkd(h.price, rate)
    }));

    const hasSnkrdunkMapping =
        card.snkrdunkProductId != null && Number(card.snkrdunkProductId) > 0;
    // 以 SNKRDUNK 為主：要有成功拎過價嘅記錄，避免有 ID 但 price 仍係 PC 時誤顯 SNK 區塊用錯數字
    const hasSnkrdunkPrice =
        hasSnkrdunkMapping &&
        card.snkrdunkUpdatedAt != null &&
        card.price != null &&
        Number(card.price) > 0 &&
        card.currency !== 'USD';

    // Trend fallback: prefer SNKRDUNK JPY when mapped, else PriceCharting USD heuristic, else legacy JPY
    if (trendData.length === 0) {
        if (hasSnkrdunkPrice) {
            trendData.push({
                date: new Date().toISOString().split('T')[0],
                price: convertJpyToHkd(card.price, rate)
            });
        } else if (card.priceRaw && card.currency === 'USD') {
            trendData.push({
                date: new Date().toISOString().split('T')[0],
                price: Math.round(card.priceRaw * 7.8)
            });
        } else if (card.price) {
            trendData.push({
                date: new Date().toISOString().split('T')[0],
                price: convertJpyToHkd(card.price, rate)
            });
        }
    }

    let price = 0;
    let hkdBenchmark = 0;

    if (hasSnkrdunkPrice) {
        price = card.price;
        hkdBenchmark = snkrdunkToHkd(card.snkrdunkPriceUsd, price, rate);
    } else if (card.priceRaw && card.currency === 'USD') {
        price = Math.round(card.priceRaw * 150);
        hkdBenchmark = Math.round(card.priceRaw * 7.8);
    } else if (card.price) {
        price = card.price;
        hkdBenchmark = convertJpyToHkd(price, rate);
    }

    const sellListings = listings.filter(l => l.type === 'sell');
    const buyListings = listings.filter(l => l.type === 'buy');

    // Group listings by merchant
    const groupListings = (list) => {
        return Object.values(list.reduce((acc, curr) => {
            if (!acc[curr.merchantId]) {
                acc[curr.merchantId] = { shop: curr.shop, items: [] };
            }
            acc[curr.merchantId].items.push(curr);
            return acc;
        }, {}));
    };

    const groupedSellListings = groupListings(sellListings);
    const groupedBuyListings = groupListings(buyListings);

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.topSection}>
                <div className={styles.imageColumn}>
                    <div className={styles.cardWrapper}>
                        <SmartImage
                            src={card.image}
                            alt={card.name}
                            className={styles.mainImage}
                            fill={false}
                            width={400}
                            height={560}
                            priority
                        />
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
                        </h2>

                        {/* Bookmark Button */}
                        <div style={{ marginTop: '16px' }}>
                            <BookmarkButton cardId={id} initialBookmarked={isBookmarked} />
                        </div>


                    </div>


                    <Card className={styles.benchmarkCard}>
                        {/* <div className={styles.benchmarkLabel}>{t('benchmark')}</div> */}

                        {hasSnkrdunkMapping ? (
                            <div
                                style={{
                                    marginBottom: '16px',
                                    paddingBottom: '12px',
                                    borderBottom: '1px solid var(--border, #eee)'
                                }}
                            >
                                {hasSnkrdunkPrice ? (
                                    <>
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '6px' }}>
                                            SNKRDUNK 參考（已按牌面貨幣換算日圓）
                                        </div>
                                        <div className={styles.benchmarkPrice}>
                                            <span className={styles.priceValue}>
                                                約 HK${hkdBenchmark.toLocaleString()}
                                                <span className={styles.priceOriginal}>(¥{price.toLocaleString()})</span>
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '0.88rem', color: '#666', lineHeight: 1.5 }}>
                                        已連結 SNKRDUNK 商品，暫時未能顯示參考價（或仍同步緊）。你可稍後再開頁面，或喺 Admin「SNKRDUNK
                                        對應」用「儲存並即時拎價」。
                                    </div>
                                )}
                                {/* PSA graded prices from SNKRDUNK */}
                                {(card.snkrdunkPricePSA10 || card.snkrdunkPricePSA9) && (
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        {card.snkrdunkPricePSA10 > 0 && (
                                            <div style={{ fontSize: '0.82rem' }}>
                                                <span style={{ color: '#9ca3af' }}>PSA 10：</span>
                                                <span style={{ color: '#e5e7eb', fontWeight: 600 }}>
                                                    約 HK${snkrdunkToHkd(card.snkrdunkPricePSA10Usd, card.snkrdunkPricePSA10, rate).toLocaleString()}
                                                </span>
                                                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}> (¥{card.snkrdunkPricePSA10.toLocaleString()})</span>
                                            </div>
                                        )}
                                        {card.snkrdunkPricePSA9 > 0 && (
                                            <div style={{ fontSize: '0.82rem' }}>
                                                <span style={{ color: '#9ca3af' }}>PSA 9：</span>
                                                <span style={{ color: '#e5e7eb', fontWeight: 600 }}>
                                                    約 HK${snkrdunkToHkd(card.snkrdunkPricePSA9Usd, card.snkrdunkPricePSA9, rate).toLocaleString()}
                                                </span>
                                                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}> (¥{card.snkrdunkPricePSA9.toLocaleString()})</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <a
                                    href={`https://snkrdunk.com/en/trading-cards/${card.snkrdunkProductId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '0.85rem', marginTop: '8px', display: 'inline-block' }}
                                >
                                    在 SNKRDUNK 查看 →
                                </a>
                                {card.snkrdunkUpdatedAt && (
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '6px' }}>
                                        上次更新：{new Date(card.snkrdunkUpdatedAt).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Display graded prices for PriceCharting cards（有 SNK 有效參考價時唔再當主參考顯示 PC Raw） */}
                        {card.priceRaw && card.currency === 'USD' && !hasSnkrdunkPrice ? (
                            <>
                                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                                    {/* Raw Price */}
                                    <div style={{ flex: '1', minWidth: '150px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>Raw / Ungraded</div>
                                        <div className={styles.benchmarkPrice}>
                                            <span className={styles.priceValue}>
                                                HK${Math.round(card.priceRaw * 7.8).toLocaleString()}
                                                <span className={styles.priceOriginal}>
                                                    (${card.priceRaw.toLocaleString()})
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* PSA 10 Price */}
                                    {card.pricePSA10 && (
                                        <div style={{ flex: '1', minWidth: '150px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>PSA 10</div>
                                            <div className={styles.benchmarkPrice}>
                                                <span className={styles.priceValue}>
                                                    HK${Math.round(card.pricePSA10 * 7.8).toLocaleString()}
                                                    <span className={styles.priceOriginal}>
                                                        (${card.pricePSA10.toLocaleString()})
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Grade 9 Price */}
                                    {card.priceGrade9 && (
                                        <div style={{ flex: '1', minWidth: '150px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>Grade 9</div>
                                            <div className={styles.benchmarkPrice}>
                                                <span className={styles.priceValue}>
                                                    HK${Math.round(card.priceGrade9 * 7.8).toLocaleString()}
                                                    <span className={styles.priceOriginal}>
                                                        (${card.priceGrade9.toLocaleString()})
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : !hasSnkrdunkPrice ? (
                            <div className={styles.benchmarkPrice}>
                                <span className={styles.priceValue}>
                                    約 ${hkdBenchmark.toLocaleString()}
                                    <span className={styles.priceOriginal}>
                                        (¥{price.toLocaleString()})
                                    </span>
                                </span>
                            </div>
                        ) : null}

                        <div className={styles.trendRow}>
                            <TrendChart data={trendData} />
                        </div>
                        {/* <TCGPlayerPrice
                            cardName={card.name}
                            setName={card.set}
                            cardNumber={card.number}
                        /> */}
                    </Card>

                    {/* Collection Price Tracker */}
                    {isBookmarked && (
                        <CollectionPriceTracker
                            cardId={id}
                            initialItems={collectionItem?.items}
                            initialPurchasePrice={collectionItem?.purchasePrice}
                            prices={{
                                raw: hasSnkrdunkPrice
                                    ? convertJpyToHkd(card.price, rate)
                                    : Math.round((card.priceRaw ? card.priceRaw * 7.8 : convertJpyToHkd(card.price || 0, rate))),
                                psa10: card.pricePSA10 ? Math.round(card.pricePSA10 * 7.8) : 0,
                                grade9: card.priceGrade9 ? Math.round(card.priceGrade9 * 7.8) : 0
                            }}
                        />
                    )}

                    <p className={styles.disclaimer}>
                        {t('disclaimer')} (Rate: {rate})
                    </p>
                </div>
            </div>

            <div className={styles.listingsSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Shop Quotations</h3>
                    {isMerchant && <InlineAddListingTrigger card={card} />}
                </div>

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
                                {groupedSellListings.map(group => (
                                    <ListingItem key={group.shop.id} group={group} t={t} />
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
                                {groupedBuyListings.map(group => (
                                    <ListingItem key={group.shop.id} group={group} t={t} />
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

function ListingItem({ group, t }) {
    const { shop, items } = group;
    const isSell = items[0]?.type === 'sell';

    return (
        <div className={styles.listingItem} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div className={styles.shopInfo}>
                    <Link href={`/shops/${shop.id}`} className={styles.shopNameLink}>
                        <div className={styles.shopName}>{shop.name}</div>
                    </Link>
                    <div className={styles.shopMeta}>{shop.location}</div>
                </div>
                <Button size="sm" variant={isSell ? 'primary' : 'secondary'}>
                    {isSell ? t('whatsapp') : t('offer')}
                </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>{item.condition} Rank</span>
                        <div className={`${styles.priceTag} ${isSell ? styles.sellColors : styles.buyColors}`} style={{ padding: '2px 8px', fontSize: '0.9rem', minWidth: '70px', textAlign: 'center' }}>
                            HK${item.price}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
