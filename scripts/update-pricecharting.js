/**
 * PriceCharting Scraper for Pokemon Cards v3
 * 
 * Fixes:
 * - Duplicate detection to prevent infinite pagination loop
 * - Properly detects end of pagination
 * - Upsert mode (preserves existing data)
 */

import mongoose from 'mongoose';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Card Schema with Graded Prices
const CardSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nameEN: String,
    image: String,
    priceRaw: Number,
    priceGrade9: Number,
    priceGrade95: Number,
    pricePSA10: Number,
    currency: { type: String, default: 'USD' },
    set: String,
    setId: String,
    cardType: { type: String, default: 'single' },
    sourceUrl: String,
    updatedAt: Date
}, { strict: false });

const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

const BASE_URL = 'https://www.pricecharting.com';
const CATEGORY_URL = `${BASE_URL}/category/pokemon-cards`;

// Configuration
const CONFIG = {
    DELAY_BETWEEN_PAGES: 1500,      // 1.5 seconds between pages
    DELAY_BETWEEN_SETS: 2000,       // 2 seconds between sets
    MAX_RETRIES: 3,
    INITIAL_BACKOFF: 30000,
    MAX_PAGES_PER_SET: 100,         // Safety limit
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function parsePrice(text) {
    if (!text) return null;
    const cleaned = text.replace(/[$,]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

async function fetchWithRetry(url, retryCount = 0) {
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
            console.log(`\n  ⚠️  Rate limited. Waiting ${backoff / 1000}s...`);
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

async function getAllSets() {
    console.log("Fetching Set List...");
    const html = await fetchWithRetry(CATEGORY_URL);
    const $ = cheerio.load(html);

    const sets = [];
    $('a[href^="/console/pokemon"]').each((i, el) => {
        const href = $(el).attr('href');
        const name = $(el).text().trim();
        if (href && name && !sets.find(s => s.url === href)) {
            sets.push({
                name: name.replace('Pokemon ', ''),
                url: href,
                id: href.split('/').pop()
            });
        }
    });

    console.log(`Found ${sets.length} Sets.`);
    return sets;
}

// Parse cards from HTML
function parseCardsFromHTML($, set) {
    const cards = [];

    $('#games_table tbody tr[id^="product-"]').each((i, row) => {
        const $row = $(row);
        const $link = $row.find('td.title a').first();
        const name = $link.text().trim();
        const cardUrl = $link.attr('href');

        if (!name || !cardUrl) return;

        const $img = $row.find('td.image img');
        let image = $img.attr('src') || $img.attr('data-src');
        if (image) {
            image = image.replace('/tiny/', '/large/').replace('/small/', '/large/');
        }

        const priceRaw = parsePrice($row.find('td.price.used_price .js-price').text()) ||
            parsePrice($row.find('td.price.used_price').text());
        const priceGrade9 = parsePrice($row.find('td.price.cib_price .js-price').text()) ||
            parsePrice($row.find('td.price.cib_price').text());
        const pricePSA10 = parsePrice($row.find('td.price.new_price .js-price').text()) ||
            parsePrice($row.find('td.price.new_price').text());

        const cardId = `pc-${set.id}-${cardUrl.split('/').pop()}`;

        cards.push({
            id: cardId,
            name,
            nameEN: name,
            image,
            priceRaw,
            priceGrade9,
            priceGrade95: null,
            pricePSA10,
            currency: 'USD',
            set: set.name,
            setId: set.id,
            cardType: 'single',
            sourceUrl: `${BASE_URL}${cardUrl}`,
            updatedAt: new Date()
        });
    });

    return cards;
}

async function getCardsFromSet(set) {
    const allCards = [];
    const seenCardIds = new Set();
    let cursor = null;
    let page = 1;

    // PriceCharting uses cursor-based pagination for API
    // We look for <input type="hidden" name="cursor" value="..."> in the response

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

            process.stdout.write(`p${page}(${newCardsCount}) `);

            // Extract next cursor from form
            // Format: <form class="js-next-page"> <input name="cursor" value="50">
            const nextCursor = $('form.js-next-page input[name="cursor"]').val();

            if (!nextCursor) {
                // No next cursor means we are on the last page
                break;
            }

            cursor = nextCursor;
            page++;
            await sleep(CONFIG.DELAY_BETWEEN_PAGES);

        } catch (error) {
            console.log(`\n  Error on page ${page}: ${error.message}`);
            break;
        }
    }

    return allCards;
}

async function main() {
    console.log("🚀 PriceCharting Scraper v3 (with duplicate detection)");
    console.log("=======================================================");
    console.log(`Config: ${CONFIG.DELAY_BETWEEN_PAGES / 1000}s between pages, max ${CONFIG.MAX_PAGES_PER_SET} pages/set\n`);

    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);

    const existingCount = await Card.countDocuments();
    console.log(`Existing cards in DB: ${existingCount}`);
    console.log("⚠️  Running in UPSERT mode\n");

    const sets = await getAllSets();

    let totalCardsAdded = 0;
    let successfulSets = 0;

    for (let i = 0; i < sets.length; i++) {
        const set = sets[i];
        process.stdout.write(`[${i + 1}/${sets.length}] ${set.name}... `);

        try {
            const cards = await getCardsFromSet(set);

            if (cards.length > 0) {
                const ops = cards.map(card => ({
                    updateOne: {
                        filter: { id: card.id },
                        update: { $set: card },
                        upsert: true
                    }
                }));
                await Card.bulkWrite(ops);
                totalCardsAdded += cards.length;
                successfulSets++;
            }

            console.log(`✓ ${cards.length} cards`);
            await sleep(CONFIG.DELAY_BETWEEN_SETS);
        } catch (e) {
            console.log(`✗ Error: ${e.message}`);
            await sleep(CONFIG.DELAY_BETWEEN_SETS * 2);
        }
    }

    const finalCount = await Card.countDocuments();
    console.log(`\n=======================================================`);
    console.log(`✅ Complete! Sets: ${successfulSets}/${sets.length}`);
    console.log(`   Cards added/updated: ${totalCardsAdded}`);
    console.log(`   Total in DB: ${finalCount}`);
    process.exit(0);
}

main().catch(console.error);
