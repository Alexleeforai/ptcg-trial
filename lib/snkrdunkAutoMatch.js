/**
 * Heuristic auto-match: DB Card (PriceCharting) ↔ SNKRDUNK tradingCards list API.
 * Uses bracket pattern like [M2a 049/193] on SNKRDUNK names vs setCode + card number on DB.
 */

const SNKRDUNK_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const SLEEP_MS = 550;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} keyword
 * @returns {Promise<Array<{ id: number, name: string, productNumber?: string }>>}
 */
export async function searchSnkrdunkTradingCards(keyword) {
    const q = (keyword || '').trim();
    if (q.length < 2) return [];
    const url = `https://snkrdunk.com/en/v1/trading-cards?keyword=${encodeURIComponent(q)}&perPage=50&page=1`;
    const res = await fetch(url, {
        headers: { 'User-Agent': SNKRDUNK_UA, Accept: 'application/json' },
        cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.code === 'INVALID_ARGUMENT') return [];
    return data.tradingCards || [];
}

/**
 * @param {string} name SNKRDUNK product name
 * @returns {{ code: string, cardNum: string, denom: string } | null}
 */
export function parseBracketFromSnkName(name) {
    if (!name) return null;
    const m = name.match(/\[([A-Za-z0-9]+)\s+(\d+)\/(\d+)\]/);
    if (!m) return null;
    return { code: m[1], cardNum: m[2], denom: m[3] };
}

/**
 * @param {{ number?: string, name?: string }} card
 * @returns {string | null} three-digit style e.g. "049"
 */
export function parseCardIndexFromDb(card) {
    if (card.number) {
        const m = String(card.number).match(/#?\s*0*(\d+)\s*$/);
        if (m) return String(parseInt(m[1], 10)).padStart(3, '0');
    }
    const m2 = (card.name || '').match(/\b(\d{1,3})\s*\/\s*(\d{1,3})\b/);
    if (m2) return String(parseInt(m2[1], 10)).padStart(3, '0');
    return null;
}

export function normalizeSetCode(s) {
    if (s == null || s === '') return '';
    return String(s).trim();
}

/** Strip trailing #123 for keyword search */
export function pickKeywordFromCardName(name) {
    if (!name) return '';
    return name.replace(/\s*#\d+\s*$/i, '').trim().slice(0, 48);
}

function sameCardNum(snNum, dbPadded) {
    return parseInt(snNum, 10) === parseInt(dbPadded, 10);
}

/**
 * @param {{ setCode?: string, number?: string, name?: string }} card
 * @param {Array<{ id: number, name: string }>} listings
 * @returns {{ id: number, name: string } | null}
 */
export function findBestSnkrdunkCandidate(card, listings) {
    if (!listings || !listings.length) return null;

    const dbCode = normalizeSetCode(card.setCode).toLowerCase();
    const idx = parseCardIndexFromDb(card);
    if (!idx) return null;

    const strong = [];
    for (const item of listings) {
        const br = parseBracketFromSnkName(item.name || '');
        if (!br) continue;
        if (!sameCardNum(br.cardNum, idx)) continue;
        if (dbCode) {
            if (br.code.toLowerCase() === dbCode.toLowerCase()) {
                strong.push(item);
            }
        } else {
            strong.push(item);
        }
    }

    if (dbCode) {
        if (strong.length === 1) return strong[0];
        return null;
    }

    // No setCode on DB: only accept if exactly one listing shares this card index among bracketed items
    if (strong.length === 1) return strong[0];
    return null;
}

/**
 * @param {{ setCode?: string, number?: string, name?: string }} card
 * @returns {Promise<{ id: number, name: string } | null>}
 */
export async function autoMatchOneCard(card) {
    const kw = pickKeywordFromCardName(card.name);
    if (!kw || kw.length < 3) return null;

    const listings = await searchSnkrdunkTradingCards(kw);
    return findBestSnkrdunkCandidate(card, listings);
}

export { SLEEP_MS };
