/**
 * SNKRDUNK trading card listing price (read-only).
 * Parses public product HTML (en) — no official API key required.
 * Prices on EN pages are often HKD; we normalize to JPY for Card.price.
 */

import { convertPrice } from './currency.js';

const SNKRDUNK_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * @param {string|number} productId - SNKRDUNK trading card id (numeric)
 * @returns {Promise<{ minPrice: number, currency: string, priceJpy: number, sourceUrl: string } | null>}
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

    const { minPrice, currency } = parsed;
    const priceJpy = Math.round(convertPrice(minPrice, currency, 'JPY'));

    return {
        minPrice,
        currency,
        priceJpy,
        sourceUrl
    };
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
