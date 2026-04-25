/**
 * SNKRDUNK trading card listing price (read-only).
 * Parses public product HTML (en) — no official API key required.
 * Prices on EN pages are often HKD; we normalize to JPY for Card.price.
 *
 * Note: SSR HTML often has minPrice: 0 while the storefront shows "HK $50~" from live listings.
 * When minPrice is 0 we fall back to the public used-listings API.
 */

import { convertPrice, SNKRDUNK_USD_TO_HKD } from './currency.js';

const SNKRDUNK_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * @param {string|number} productId - SNKRDUNK trading card id (numeric)
 * @returns {Promise<{ minPrice: number, currency: string, priceJpy: number, sourceUrl: string, source?: string } | null>}
 */
/**
 * @param {string|number} productId
 * @returns {Promise<{
 *   priceJpy: number,
 *   pricePSA10Jpy: number|null,
 *   pricePSA9Jpy: number|null,
 *   minPrice: number,
 *   currency: string,
 *   source: string,
 *   sourceUrl: string
 * } | null>}
 */
export async function fetchSnkrdunkTradingCardQuote(productId) {
    const id = String(productId).trim();
    if (!/^\d+$/.test(id)) return null;

    const sourceUrl = `https://snkrdunk.com/en/trading-cards/${id}`;

    // Fetch page HTML and all listings in parallel
    const [pageRes, listingsByCondition] = await Promise.all([
        fetch(sourceUrl, { headers: { 'User-Agent': SNKRDUNK_UA, Accept: 'text/html' }, cache: 'no-store' }),
        fetchAllListingsByCondition(id)
    ]);

    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    // ── Raw price: Grade A first, fallback to HTML only when API has nothing ──
    // Priority: Grade A listing → Grade B → Grade S → page HTML → overall min
    let minPrice = 0;
    let currency = 'HKD';
    let source = 'used-listings-A';

    const RAW_GRADE_PRIORITY = ['A', 'B', 'S'];
    if (listingsByCondition) {
        for (const grade of RAW_GRADE_PRIORITY) {
            const listing = listingsByCondition[grade];
            if (listing && listing.amount > 0) {
                minPrice = listing.amount;
                currency = listing.currency;
                source = `used-listings-${grade}`;
                break;
            }
        }
    }

    // Fall back to page HTML only when API has no Grade A/B/S listing
    if (minPrice <= 0) {
        const parsed = parseTradingCardHtml(html);
        if (parsed?.minPrice > 0) {
            minPrice = parsed.minPrice;
            currency = parsed.currency;
            source = 'page';
        }
    }
    if (minPrice <= 0) {
        const fromFormat = parseMinPriceFormatHkd(html);
        if (fromFormat?.amount > 0) {
            minPrice = fromFormat.amount;
            currency = fromFormat.currency;
            source = 'minPriceFormat';
        }
    }
    if (minPrice <= 0 && listingsByCondition) {
        const overall = findOverallMin(listingsByCondition);
        if (overall?.amount > 0) {
            minPrice = overall.amount;
            currency = overall.currency;
            source = 'used-listings-overall';
        }
    }

    if (minPrice <= 0) return null;

    const priceJpy = Math.round(convertPrice(minPrice, currency, 'JPY'));
    // Store HKD directly for accurate display — no conversion error
    const priceHkd = Math.round(listingToHkd({ amount: minPrice, currency }));
    // Only store USD when the listing is actually USD (never back-compute from HKD — that hid cheaper USD listings)
    const priceUsd = currency === 'USD' ? minPrice : null;

    // PSA grades from listings
    const psa10 = listingsByCondition?.['PSA 10'];
    const psa9 = listingsByCondition?.['PSA 9'];
    const pricePSA10Jpy = psa10 ? Math.round(convertPrice(psa10.amount, psa10.currency, 'JPY')) : null;
    const pricePSA9Jpy = psa9 ? Math.round(convertPrice(psa9.amount, psa9.currency, 'JPY')) : null;
    const pricePSA10Usd = psa10?.currency === 'USD' ? psa10.amount : null;
    const pricePSA9Usd = psa9?.currency === 'USD' ? psa9.amount : null;
    const pricePSA10Hkd = psa10 ? Math.round(listingToHkd(psa10)) : null;
    const pricePSA9Hkd = psa9 ? Math.round(listingToHkd(psa9)) : null;

    return {
        minPrice,
        currency,
        priceJpy,
        priceUsd,
        priceHkd,
        pricePSA10Jpy,
        pricePSA9Jpy,
        pricePSA10Usd,
        pricePSA9Usd,
        pricePSA10Hkd,
        pricePSA9Hkd,
        sourceUrl,
        source
    };
}

/**
 * Fetch all active used listings and group by condition (e.g. "A", "PSA 10", "PSA 9").
 * Returns map of condition → { amount, currency } for the cheapest listing in that condition.
 * @param {string} tradingCardId
 * @returns {Promise<Record<string, { amount: number, currency: string }> | null>}
 */
async function fetchAllListingsByCondition(tradingCardId) {
    // Paginate through ALL listings (sortType=2 = price-ascending, but sort is global across
    // all grades, so cheapest Grade A may appear on page 3+).
    // Cap at 10 pages × 50 = 500 listings to avoid runaway requests.
    const MAX_PAGES = 10;
    const PER_PAGE = 50;
    const seen = new Set();
    const byCondition = {};

    for (const onSale of [true, false]) {
        for (let page = 1; page <= MAX_PAGES; page++) {
            const url = `https://snkrdunk.com/en/v1/trading-cards/${tradingCardId}/used-listings?perPage=${PER_PAGE}&page=${page}&sortType=2&isOnlyOnSale=${onSale}`;
            try {
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': SNKRDUNK_UA,
                        Accept: 'application/json',
                        'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8'
                    },
                    cache: 'no-store'
                });
                if (!res.ok) break;
                const data = await res.json();
                const items = data.usedTradingCards || [];
                if (items.length === 0) break;

                for (const row of items) {
                    const key = row.id ?? row.usedTradingCardId ?? `${row.condition}|${row.price}`;
                    if (seen.has(key)) continue;
                    seen.add(key);

                    const cond = row.condition || 'unknown';
                    const p = parseListingPrice(row.price);
                    if (!p || p.amount <= 0) continue;
                    if (!byCondition[cond] || listingToHkd(p) < listingToHkd(byCondition[cond])) {
                        byCondition[cond] = p;
                    }
                }

                if (items.length < PER_PAGE) break; // last page
            } catch {
                break;
            }
        }
        // If on-sale already found Grade A/B/S, skip the off-sale scan
        if (byCondition['A'] || byCondition['B'] || byCondition['S']) break;
    }

    return Object.keys(byCondition).length > 0 ? byCondition : null;
}

/**
 * Convert a listing price to HKD for comparison purposes.
 * Uses USD × 7.78 (market rate), HKD direct, JPY ÷ 19.3 (approx).
 * This avoids selecting expensive HKD-priced listings over cheaper USD ones.
 */
function listingToHkd(p) {
    if (!p) return Infinity;
    if (p.currency === 'HKD') return p.amount;
    if (p.currency === 'USD') return p.amount * SNKRDUNK_USD_TO_HKD;
    if (p.currency === 'JPY') return p.amount / 19.3;
    return p.amount; // SGD or other — treat as HKD approx
}

/**
 * Find the cheapest price across all conditions (HKD basis).
 */
function findOverallMin(byCondition) {
    let best = null;
    for (const p of Object.values(byCondition)) {
        if (!best) { best = p; continue; }
        if (listingToHkd(p) < listingToHkd(best)) best = p;
    }
    return best;
}

/**
 * @param {string | undefined} priceStr e.g. "HK $5660", "US $268", "HK $1,234"
 * @returns {{ amount: number, currency: string } | null}
 */
export function parseListingPrice(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return null;
    const m = priceStr.match(/^(HK|US|JP|S)\s*\$\s*([\d,]+)\s*~?/i);
    if (!m) return null;
    const amount = parseInt(m[2].replace(/,/g, ''), 10);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const prefix = m[1].toUpperCase();
    const currency = prefix === 'HK' ? 'HKD' : prefix === 'US' ? 'USD' : prefix === 'JP' ? 'JPY' : 'SGD';
    return { amount, currency };
}

/**
 * @param {string | undefined} priceStr e.g. "HK $5660", "HK $1,234"
 * @returns {number | null}
 * @deprecated Use parseListingPrice instead
 */
export function parseListingPriceToHkd(priceStr) {
    const p = parseListingPrice(priceStr);
    if (!p || p.currency !== 'HKD') return null;
    return p.amount;
}

/**
 * SSR sometimes leaves minPrice at 0 but minPriceFormat still shows "HK $50~" or "US $268~".
 * @param {string} html
 * @returns {{ amount: number, currency: string } | null}
 */
export function parseMinPriceFormatHkd(html) {
    if (!html) return null;
    const entity = html.match(/minPriceFormat&#34;:&#34;([^&]*)&#34;/);
    const plain = html.match(/"minPriceFormat":"([^"]*)"/);
    const fmt = entity ? entity[1] : plain ? plain[1] : null;
    if (!fmt || fmt.includes('$ -')) return null;
    return parseListingPrice(fmt);
}

/**
 * @param {string} html
 * @returns {{ minPrice: number, currency: string } | null}
 */
export function parseTradingCardHtml(html) {
    if (!html || html.includes('404 page not found')) return null;

    let minPrice;
    let currency = 'HKD';

    const entityPrice = html.match(/minPrice&#34;:(\d+)/);
    const plainPrice = html.match(/"minPrice":(\d+)/);
    if (entityPrice) minPrice = parseInt(entityPrice[1], 10);
    else if (plainPrice) minPrice = parseInt(plainPrice[1], 10);

    const entityCur = html.match(/minPriceCurrency&#34;:&#34;([A-Z]{3})&#34;/);
    const plainCur = html.match(/"minPriceCurrency":"([A-Z]{3})"/);
    if (entityCur) currency = entityCur[1];
    else if (plainCur) currency = plainCur[1];

    // Fallback: view_content_web tracking event embeds the real overall minimum
    // (includes JP marketplace listings that the EN used-listings API omits)
    if (!minPrice || minPrice <= 0) {
        const trackMatch = html.match(/view_content[^}]*"price"\s*:\s*(\d+)[^}]*"currency"\s*:\s*"([A-Z]{3})"/);
        const trackMatch2 = html.match(/"price"\s*:\s*(\d+)\s*,\s*"product_code"\s*:\s*"SW---/);
        if (trackMatch) {
            minPrice = parseInt(trackMatch[1], 10);
            currency = trackMatch[2];
        } else if (trackMatch2) {
            minPrice = parseInt(trackMatch2[1], 10);
            // currency context from nearby field
            const curNearby = html.match(/"currency"\s*:\s*"([A-Z]{3})"\s*,\s*"event"\s*:\s*"view_content/);
            if (curNearby) currency = curNearby[1];
            else currency = 'USD'; // SNKRDUNK EN tracking is always USD
        }
    }

    if (!minPrice || Number.isNaN(minPrice) || minPrice <= 0) return null;
    return { minPrice, currency };
}
