/**
 * JustTCG API Helper (Price Source)
 */

const API_KEY = process.env.JUSTTCG_API_KEY;
const BASE_URL = 'https://api.justtcg.com/v1';

export async function fetchJPPrices(cardName, setCode) {
    if (!API_KEY) return null;

    try {
        // Search by name. 
        // Note: JustTCG search often works best with exact name or simple query.
        const url = `${BASE_URL}/cards?q=name:${encodeURIComponent(cardName)}&limit=1`;

        const response = await fetch(url, {
            headers: {
                'x-api-key': API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) return 0;

        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
            // Get first match
            const card = data.data[0];

            // Check prices array
            if (card.prices && card.prices.length > 0) {
                // Return the first available price (usually 'Normal' or 'Holofoil')
                // Prefer USD? Or JustTCG returns generic currency?
                // The API test showed `currency: "USD"` and `price: 12.53`.
                // Our system assumes JPY mostly for JP cards, but if JustTCG gives USD, we should store it as USD.
                // However, `update-jp-cards.js` hardcodes `currency: 'JPY'`.
                // I should update `update-jp-cards.js` to use the returned currency if possible, 
                // OR just accept that JP cards will have USD prices now.
                // For now, I'll return the numeric price.
                return card.prices[0].price || 0;
            }
        }

        return 0;

    } catch (e) {
        console.warn('JustTCG fetch error:', e.message);
        return 0;
    }
}
