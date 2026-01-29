/**
 * PriceCharting Scraper for Pokemon Cards
 * Scrapes Sets + Cards with Graded Prices (PSA 10, 9.5, 9, Ungraded/Raw)
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
    // Graded Prices (USD)
    priceRaw: Number,       // Ungraded
    priceGrade9: Number,    // Grade 9
    priceGrade95: Number,   // Grade 9.5
    pricePSA10: Number,     // PSA 10
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Parse price from text (e.g., "$123.45" -> 123.45)
function parsePrice(text) {
    if (!text) return null;
    const cleaned = text.replace(/[$,]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

async function fetchHTML(url) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
}

async function getAllSets() {
    console.log("Fetching Set List...");
    const html = await fetchHTML(CATEGORY_URL);
    const $ = cheerio.load(html);

    const sets = [];
    // Find all set links in the category page
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

async function getCardsFromSet(set) {
    const url = `${BASE_URL}${set.url}`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    const cards = [];

    // Find the product table (correct selector: #games_table)
    $('#games_table tbody tr[id^="product-"]').each((i, row) => {
        const $row = $(row);

        // Get card name and link
        const $link = $row.find('td.title a').first();
        const name = $link.text().trim();
        const cardUrl = $link.attr('href');

        if (!name || !cardUrl) return;

        // Get thumbnail image from td.image
        const $img = $row.find('td.image img');
        let image = $img.attr('src') || $img.attr('data-src');
        // Convert thumbnail to larger image if possible
        if (image) {
            image = image.replace('/tiny/', '/large/').replace('/small/', '/large/');
        }

        // Get prices from correct columns
        // PriceCharting uses: used_price (Ungraded), cib_price (Grade 9), new_price (PSA 10)
        const priceRaw = parsePrice($row.find('td.price.used_price .js-price').text()) ||
            parsePrice($row.find('td.price.used_price').text());
        const priceGrade9 = parsePrice($row.find('td.price.cib_price .js-price').text()) ||
            parsePrice($row.find('td.price.cib_price').text());
        // Grade 9.5 might not exist on all pages
        const priceGrade95 = null; // Not available on PriceCharting
        const pricePSA10 = parsePrice($row.find('td.price.new_price .js-price').text()) ||
            parsePrice($row.find('td.price.new_price').text());

        // Create unique ID
        const cardId = `pc-${set.id}-${cardUrl.split('/').pop()}`;

        cards.push({
            id: cardId,
            name,
            nameEN: name,
            image,
            priceRaw,
            priceGrade9,
            priceGrade95,
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

async function main() {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Clean old data
    console.log("Cleaning DB...");
    await Card.deleteMany({});

    // Get all sets
    const sets = await getAllSets();

    let totalCards = 0;

    for (let i = 0; i < sets.length; i++) {
        const set = sets[i];
        process.stdout.write(`[${i + 1}/${sets.length}] ${set.name}... `);

        try {
            await sleep(500); // Rate limit
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
                totalCards += cards.length;
            }

            console.log(`${cards.length} cards.`);
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }

    console.log(`\n✅ Import Complete. Total: ${totalCards} cards.`);
    process.exit(0);
}

main().catch(console.error);
