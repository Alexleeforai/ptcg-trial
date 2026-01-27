/**
 * TCGdex API Helper (Japanese Card Backbone)
 * Docs: https://www.tcgdex.net/docs/
 */

const BASE_URL = 'https://api.tcgdex.net/v2/ja';

/**
 * Fetch all cards from a specific set
 * @param {string} setId - e.g., "sv4a" (Shiny Treasure)
 */
export async function getJPCardsBySet(setId) {
    try {
        const res = await fetch(`${BASE_URL}/sets/${setId}`);
        if (!res.ok) throw new Error(`TCGdex API error: ${res.status}`);

        const data = await res.json();
        const cards = data.cards || [];

        // Fetch detailed info for each card (limited concurrency)
        // Note: TCGdex list only gives basic info. We might need details for image.
        // Actually, TCGdex images follow a pattern usually.
        // Image format: https://assets.tcgdex.net/jp/{set}/{localId}/high.png

        return cards.map(c => ({
            id: c.id, // e.g., sv4a-001
            localId: c.localId,
            name: c.name,
            image: c.image ? `${c.image}/high.webp` : `https://assets.tcgdex.net/ja/${setId}/${c.localId}/high.webp`,
            set: data.name,
            setId: setId
        }));
    } catch (e) {
        console.error('TCGdex fetch error:', e);
        return [];
    }
}

/**
 * Search JP cards
 */
export async function searchJPCards(query) {
    // TCGdex doesn't have a great direct search for JP only via simple endpoint sometimes,
    // but we can try generic query.
    // For now, we rely on set scraping mostly.
    return [];
}
