// lib/currency.js

// Default fallback rate (100 JPY = 5.2 HKD)
const DEFAULT_RATE = 0.052;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

let cachedRate = null;
let lastFetchTime = 0;

/**
 * Get the current JPY to HKD exchange rate.
 * Fetches from API and caches for 24 hours.
 */
export async function getJpyToHkdRate() {
    const now = Date.now();

    if (cachedRate && (now - lastFetchTime < CACHE_TTL)) {
        return cachedRate;
    }

    try {
        console.log('[Currency] Fetching latest JPY rates...');
        const res = await fetch('https://open.er-api.com/v6/latest/JPY', { next: { revalidate: 86400 } });

        if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        const rate = data.rates?.HKD;

        if (rate) {
            console.log(`[Currency] Updated JPY->HKD rate: ${rate}`);
            cachedRate = rate;
            lastFetchTime = now;
            return rate;
        }
    } catch (e) {
        console.error('[Currency] Failed to fetch rate, using fallback:', e);
    }

    return cachedRate || DEFAULT_RATE;
}

/**
 * Convert JPY price to HKD using the provided rate
 */
export function convertJpyToHkd(priceJpy, rate) {
    if (!priceJpy) return 0;
    return Math.round(priceJpy * rate);
}
