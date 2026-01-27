/**
 * Pokemon TCG API Helper
 * API Docs: https://docs.pokemontcg.io/
 */

const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMONTCG_API_KEY;

/**
 * Fetch cards from Pokemon TCG API
 * @param {string} query - Search query (card name, set name, etc.)
 * @param {number} pageSize - Number of results per page (max 250)
 * @returns {Promise<Array>} Array of card objects
 */
export async function searchPokemonTCG(query, pageSize = 100) {
    try {
        // Manual URL construction to avoid over-encoding of colon
        // Remove quotes to avoid 404s with some fetch implementations/API quirks
        const url = `${API_BASE_URL}/cards?q=name:${encodeURIComponent(query)}&pageSize=${pageSize}`;

        console.log(`Fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                'X-Api-Key': API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Map API response to our Card schema
        return data.data.map(card => mapToCardSchema(card));

    } catch (error) {
        console.error('Pokemon TCG API Error:', error);
        return [];
    }
}

/**
 * Fetch all cards from a specific set
 * @param {string} setId - Set ID (e.g., 'base1', 'swsh1')
 * @returns {Promise<Array>} Array of card objects
 */
export async function getCardsBySet(setId) {
    try {
        const url = `${API_BASE_URL}/cards?q=set.id:${setId}&pageSize=250`;

        const response = await fetch(url, {
            headers: {
                'X-Api-Key': API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data.map(card => mapToCardSchema(card));

    } catch (error) {
        console.error('Pokemon TCG API Error:', error);
        return [];
    }
}

/**
 * Get list of all sets
 * @returns {Promise<Array>} Array of set objects
 */
export async function getAllSets() {
    try {
        const url = `${API_BASE_URL}/sets`;

        const response = await fetch(url, {
            headers: {
                'X-Api-Key': API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        return data.data;

    } catch (error) {
        console.error('Pokemon TCG API Error:', error);
        return [];
    }
}

/**
 * Map Pokemon TCG API response to our Card schema
 */
function mapToCardSchema(apiCard) {
    // Extract price - prefer TCGPlayer market price
    let price = 0;
    let currency = 'USD';

    if (apiCard.tcgplayer?.prices) {
        // Try different price types in order of preference
        const priceTypes = ['holofoil', 'reverseHolofoil', 'normal', 'unlimited'];
        for (const type of priceTypes) {
            if (apiCard.tcgplayer.prices[type]?.market) {
                price = apiCard.tcgplayer.prices[type].market;
                break;
            }
        }
    }

    return {
        id: `tcg-${apiCard.id}`,
        tcgPlayerId: apiCard.id,
        name: apiCard.name,
        nameEN: apiCard.name,
        nameJP: null, // API doesn't provide Japanese names
        nameCN: null,
        image: apiCard.images?.large || apiCard.images?.small || '',
        price: price,
        currency: currency,
        set: apiCard.set?.name || 'Unknown',
        cardType: 'single',
        releaseDate: apiCard.set?.releaseDate || '',
        link: `https://www.tcgplayer.com${apiCard.tcgplayer?.url || ''}`,
        updatedAt: new Date()
    };
}
