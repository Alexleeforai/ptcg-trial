/**
 * SNKRDUNK trading card listing price (read-only).
 * Parses public product HTML (en) — no official API key required.
 * Prices on EN pages are often HKD; we normalize to JPY for Card.price.
 *
 * Note: SSR HTML often has minPrice: 0 while the storefront shows "HK $50~" from live listings.
 * When minPrice is 0 we fall back to the public used-listings API.
 */

import { convertPrice } from './currency.js';

const SNKRDUNK_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * @param {string|number} productId - SNKRDUNK trading card id (numeric)
 * @returns {Promise<{ minPrice: number, currency: string, priceJpy: number, sourceUrl: string, source?: string } | null>}
 */
export async function fetchSnkrdunkTradingCardQuote(productId) {
    const id = String(productId).trim();
    if (!/^\d+$/.test(id)) return null;

    const sourceUrl = `https://snkrdunk.com/en/trading-cards/${id}`;
    const res = await fetch(sourceUrl, {
        headers: { 'User-Agent': SNKRDUNK_UA, Accept: 'text/html' },
        cache: 'no-store'
    });

    if (!res.ok) return null;
    const html = await res.text();
    const parsed = parseTradingCardHtml(html);
    if (!parsed) return null;

    let { minPrice, currency } = parsed;
    let source = 'page';

    if (minPrice <= 0) {
        const fromFormat = parseMinPriceFormatHkd(html);
        if (fromFormat != null && fromFormat > 0) {
            minPrice = fromFormat;
            currency = 'HKD';
            source = 'minPriceFormat';
        }
    }

    if (minPrice <= 0) {
        const fromListings = await fetchMinHkdFromUsedListings(id);
        if (fromListings != null && fromListings > 0) {
            minPrice = fromListings;
            currency = 'HKD';
            source = 'used-listings';
        }
    }

    const priceJpy = Math.round(convertPrice(minPrice, currency, 'JPY'));

    return {
        minPrice,
        currency,
        priceJpy,
        sourceUrl,
        source
    };
}

/**
 * Lowest HKD from used listings API (en).
 * @param {string} tradingCardId
 * @returns {Promise<number | null>}
 */
async function fetchMinHkdFromUsedListings(tradingCardId) {
    // perPage above 50 returns INVALID_ARGUMENT from SNKRDUNK API (verified 2026-04).
    const bases = [
        `https://snkrdunk.com/en/v1/trading-cards/${tradingCardId}/used-listings?perPage=50&page=1&sortType=1&isOnlyOnSale=true`,
        `https://snkrdunk.com/en/v1/trading-cards/${tradingCardId}/used-listings?perPage=50&page=1&sortType=1&isOnlyOnSale=false`
    ];

    let best = null;

    for (const url of bases) {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': SNKRDUNK_UA, Accept: 'application/json' },
                cache: 'no-store'
            });
            if (!res.ok) continue;
            const data = await res.json();
            const items = data.usedTradingCards || [];
            for (const row of items) {
                const n = parseListingPriceToHkd(row.price);
                if (n != null && n > 0 && (best == null || n < best)) best = n;
            }
            if (best != null) break;
        } catch {
            /* ignore */
        }
    }

    return best;
}

/**
 * @param {string | undefined} priceStr e.g. "HK $5660", "HK $1,234"
 * @returns {number | null}
 */
export function parseListingPriceToHkd(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return null;
    const m = priceStr.match(/HK\s*\$\s*([\d,]+)\s*~?/i);
    if (!m) return null;
    const n = parseInt(m[1].replace(/,/g, ''), 10);
    return Number.isFinite(n) ? n : null;
}

/**
 * SSR sometimes leaves minPrice at 0 but minPriceFormat still shows "HK $50~".
 * @param {string} html
 * @returns {number | null}
 */
export function parseMinPriceFormatHkd(html) {
    if (!html) return null;
    const entity = html.match(/minPriceFormat&#34;:&#34;([^&]*)&#34;/);
    const plain = html.match(/"minPriceFormat":"([^"]*)"/);
    const fmt = entity ? entity[1] : plain ? plain[1] : null;
    if (!fmt || fmt.includes('$ -')) return null;
    return parseListingPriceToHkd(fmt);
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
    else return null;

    const entityCur = html.match(/minPriceCurrency&#34;:&#34;([A-Z]{3})&#34;/);
    const plainCur = html.match(/"minPriceCurrency":"([A-Z]{3})"/);
    if (entityCur) currency = entityCur[1];
    else if (plainCur) currency = plainCur[1];

    if (Number.isNaN(minPrice)) return null;
    return { minPrice, currency };
}
