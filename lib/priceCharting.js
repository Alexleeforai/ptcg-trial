import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.pricecharting.com';

// Configuration
const CONFIG = {
    DELAY_BETWEEN_PAGES: 1000,      // 1 second (slightly faster for cron)
    MAX_RETRIES: 3,
    INITIAL_BACKOFF: 5000,
    MAX_PAGES_PER_SET: 100,
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function parsePrice(text) {
    if (!text) return null;
    const cleaned = text.replace(/[$,]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

export async function fetchWithRetry(url, retryCount = 0) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            }
        });

        if (res.status === 429) {
            if (retryCount >= CONFIG.MAX_RETRIES) {
                throw new Error(`HTTP 429 - Max retries exceeded`);
            }
            const backoff = CONFIG.INITIAL_BACKOFF * Math.pow(2, retryCount);
            console.log(`[PriceCharting] Rate limited. Waiting ${backoff / 1000}s...`);
            await sleep(backoff);
            return fetchWithRetry(url, retryCount + 1);
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
    } catch (error) {
        if (retryCount < CONFIG.MAX_RETRIES) {
            await sleep(CONFIG.INITIAL_BACKOFF);
            return fetchWithRetry(url, retryCount + 1);
        }
        throw error;
    }
}

function parseCardsFromHTML($, set) {
    const cards = [];

    // Rows in the main table
    $('#games_table tbody tr').each((i, el) => {
        const row = $(el);
        const nameCell = row.find('.title a');

        if (!nameCell.length) return; // Skip ad rows or empty

        const name = nameCell.text().trim();
        const url = nameCell.attr('href');
        const id = url ? url.split('/').pop() : null; // Use URL slug as ID

        // Prices
        const priceLoose = parsePrice(row.find('.price.used_price').text());
        const priceCIB = parsePrice(row.find('.price.cib_price').text());
        const priceNew = parsePrice(row.find('.price.new_price').text());
        const priceGraded = parsePrice(row.find('.price.graded_price').text());

        if (id && name) {
            cards.push({
                id: `pc-${id}`, // Prefix to avoid collision
                name: name,
                set: set.name,
                setId: set.id,
                priceRaw: priceLoose || 0,
                priceGrade9: priceCIB || 0,
                pricePSA10: priceGraded || 0,
                image: null, // Image usually requires detail page or is tiny thumbnail. We skip for list view.
                currency: 'USD',
                sourceUrl: `${BASE_URL}${url}`,
                updatedAt: new Date()
            });
        }
    });

    return cards;
}

export async function getCardsFromSet(set) {
    const allCards = [];
    const seenCardIds = new Set();
    let cursor = null;
    let page = 1;

    console.log(`[PriceCharting] Scraping set: ${set.name} (${set.id})`);

    while (page <= CONFIG.MAX_PAGES_PER_SET) {
        // Construct URL with cursor if present
        const url = cursor
            ? `${BASE_URL}${set.url}?cursor=${cursor}`
            : `${BASE_URL}${set.url}`;

        try {
            const html = await fetchWithRetry(url);
            const $ = cheerio.load(html);
            const cards = parseCardsFromHTML($, set);

            if (cards.length === 0) {
                break;
            }

            let newCardsCount = 0;
            for (const card of cards) {
                if (!seenCardIds.has(card.id)) {
                    seenCardIds.add(card.id);
                    allCards.push(card);
                    newCardsCount++;
                }
            }

            // Extract next cursor from form
            const nextCursor = $('form.js-next-page input[name="cursor"]').val();

            if (!nextCursor) {
                break;
            }

            cursor = nextCursor;
            page++;
            await sleep(CONFIG.DELAY_BETWEEN_PAGES);

        } catch (error) {
            console.error(`[PriceCharting] Error on page ${page} of ${set.name}: ${error.message}`);
            break;
        }
    }

    return allCards;
}
