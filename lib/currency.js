/**
 * Multi-Currency Conversion Utilities
 * Supports: JPY, USD, HKD, CNY
 */

// Exchange rates (as of reference date)
// In production, these could be fetched from an API
const EXCHANGE_RATES = {
    JPY: 1,
    USD: 0.0067,    // 1 JPY = 0.0067 USD
    HKD: 0.052,     // 1 JPY = 0.052 HKD
    CNY: 0.048      // 1 JPY = 0.048 CNY
};

// Reverse rates for conversion from other currencies to JPY
const TO_JPY_RATES = {
    JPY: 1,
    USD: 149.25,    // 1 USD = 149.25 JPY
    HKD: 19.23,     // 1 HKD = 19.23 JPY
    CNY: 20.83      // 1 CNY = 20.83 JPY
};

/**
 * Convert price from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} Converted amount
 */
export function convertPrice(amount, fromCurrency, toCurrency) {
    if (!amount || amount === 0) return 0;
    if (fromCurrency === toCurrency) return amount;

    // Convert to JPY first (as base currency)
    const amountInJPY = amount * (TO_JPY_RATES[fromCurrency] || 1);

    // Then convert to target currency
    const converted = amountInJPY * (EXCHANGE_RATES[toCurrency] || 1);

    return Math.round(converted * 100) / 100; // Round to 2 decimal places
}

/**
 * Format price with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted price string
 */
export function formatPrice(amount, currency) {
    if (!amount || amount === 0) return '-';

    const symbols = {
        JPY: '¥',
        USD: '$',
        HKD: 'HK$',
        CNY: '¥'
    };

    const symbol = symbols[currency] || currency;

    // Format based on currency
    if (currency === 'JPY') {
        // JPY has no decimal places
        return `${symbol}${Math.round(amount).toLocaleString()}`;
    } else {
        // Other currencies show 2 decimal places
        return `${symbol}${amount.toFixed(2)}`;
    }
}

/**
 * Get currency display name
 * @param {string} currency - Currency code
 * @returns {string} Display name
 */
export function getCurrencyName(currency) {
    const names = {
        JPY: '日圓 (JPY)',
        USD: '美元 (USD)',
        HKD: '港幣 (HKD)',
        CNY: '人民幣 (CNY)'
    };

    return names[currency] || currency;
}

/**
 * Get all supported currencies
 * @returns {Array} Array of currency objects
 */
export function getSupportedCurrencies() {
    return [
        { code: 'HKD', name: '港幣 (HKD)', symbol: 'HK$' },
        { code: 'CNY', name: '人民幣 (CNY)', symbol: '¥' },
        { code: 'USD', name: '美元 (USD)', symbol: '$' },
        { code: 'JPY', name: '日圓 (JPY)', symbol: '¥' }
    ];
}

// ========= BACKWARDS COMPATIBILITY =========
// Keep old JPY-to-HKD functions for existing code

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
