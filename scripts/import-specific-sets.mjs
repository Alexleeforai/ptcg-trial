/**
 * Import specific PriceCharting sets by URL.
 * Usage: node scripts/import-specific-sets.mjs
 */

import mongoose from 'mongoose';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CardSchema = new mongoose.Schema({}, { strict: false });
const Card = mongoose.models?.Card || mongoose.model('Card', CardSchema);

const BASE_URL = 'https://www.pricecharting.com';
const DELAY = 1500;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Sets to import ──────────────────────────────────────────────────
const SETS = [
    { name: 'Japanese Miracle of the Desert',          url: '/console/pokemon-japanese-miracle-of-the-desert' },
    { name: 'Japanese Rulers of the Heavens',          url: '/console/pokemon-japanese-rulers-of-the-heavens' },
    { name: 'Japanese Undone Seal',                    url: '/console/pokemon-japanese-undone-seal' },
    { name: 'Japanese Flight of Legends',              url: '/console/pokemon-japanese-flight-of-legends' },
    { name: 'Japanese Mirage Forest',                  url: '/console/pokemon-japanese-mirage-forest' },
    { name: 'Japanese Miracle Crystal',                url: '/console/pokemon-japanese-miracle-crystal' },
    { name: 'Japanese World Champions Pack',           url: '/console/pokemon-japanese-world-champions-pack' },
    { name: 'Japanese Secret of the Lakes',            url: '/console/pokemon-japanese-secret-of-the-lakes' },
    { name: 'Japanese Moonlit Pursuit & Dawn Dash',    url: '/console/pokemon-japanese-moonlit-pursuit' },
    { name: 'Japanese Cry from the Mysterious & Temple of Anger', url: '/console/pokemon-japanese-cry-from-the-mysterious' },
    { name: "Japanese Galactic's Conquest",            url: "/console/pokemon-japanese-galactic%27s-conquest" },
    { name: 'Japanese Bonds to the End of Time',       url: '/console/pokemon-japanese-bonds-to-the-end-of-time' },
    { name: 'Japanese Beat of the Frontier',           url: '/console/pokemon-japanese-beat-of-the-frontier' },
    { name: 'Japanese Advent of Arceus',               url: '/console/pokemon-japanese-advent-of-arceus' },
    { name: 'Japanese HeartGold Collection',           url: '/console/pokemon-japanese-heartgold-collection' },
    { name: 'Japanese SoulSilver Collection',          url: '/console/pokemon-japanese-soulsilver-collection' },
    { name: 'Japanese Reviving Legends',               url: '/console/pokemon-japanese-reviving-legends' },
    { name: 'Japanese Clash at the Summit',            url: '/console/pokemon-japanese-clash-at-the-summit' },
    { name: 'Japanese Black Collection',               url: '/console/pokemon-japanese-black-collection' },
    { name: 'Japanese White Collection',               url: '/console/pokemon-japanese-white-collection' },
    { name: 'Japanese Red Collection',                 url: '/console/pokemon-japanese-red-collection' },
    { name: 'Japanese Hail Blizzard',                  url: '/console/pokemon-japanese-hail-blizzard' },
    { name: 'Japanese Psycho Drive',                   url: '/console/pokemon-japanese-psycho-drive' },
    { name: 'Japanese Dark Rush',                      url: '/console/pokemon-japanese-dark-rush' },
    { name: 'Japanese Dragon Blast',                   url: '/console/pokemon-japanese-dragon-blast' },
    { name: 'Japanese Dragon Blade',                   url: '/console/pokemon-japanese-dragon-blade' },
    { name: 'Japanese Freeze Bolt',                    url: '/search-products?q=Freeze+Bolt+&type=prices' },
    { name: 'Japanese Cold Flare',                     url: '/search-products?q=Cold+Flare&type=prices' },
    { name: 'Japanese Plasma Gale',                    url: '/console/pokemon-japanese-plasma-gale' },
    { name: 'Japanese Spiral Force',                   url: '/console/pokemon-japanese-spiral-force' },
    { name: 'Japanese Thunder Knuckle',                url: '/console/pokemon-japanese-thunder-knuckle' },
    { name: 'Japanese Megalo Cannon',                  url: '/console/pokemon-japanese-megalo-cannon' },
    { name: 'Japanese Collection X',                   url: '/console/pokemon-japanese-collection-x' },
    { name: 'Japanese Collection Y',                   url: '/console/pokemon-japanese-collection-y' },
    { name: 'Japanese Gaia Volcano',                   url: '/console/pokemon-japanese-gaia-volcano' },
    { name: 'Japanese Tidal Storm',                    url: '/console/pokemon-japanese-tidal-storm' },
    { name: 'Japanese Blue Shock',                     url: '/console/pokemon-japanese-blue-shock' },
    { name: 'Japanese Red Flash',                      url: '/console/pokemon-japanese-red-flash' },
    { name: 'Japanese Rage of the Broken Heavens',     url: '/console/pokemon-japanese-rage-of-the-broken-heavens' },
    { name: 'Japanese Fever-Burst Fighter',            url: '/console/pokemon-japanese-fever-burst-fighter' },
    { name: 'Japanese Cruel Traitor',                  url: '/console/pokemon-japanese-cruel-traitor' },
    { name: 'Japanese Sun & Moon New Friends',         url: '/console/pokemon-japanese-sun-&-moon-new-friends' },
    { name: 'Japanese Collection Sun',                 url: '/console/pokemon-japanese-collection-sun' },
    { name: 'Japanese Collection Moon',                url: '/console/pokemon-japanese-collection-moon' },
    { name: 'Japanese Islands Await You',              url: '/console/pokemon-japanese-islands-await-you' },
    { name: 'Japanese Alolan Moonlight',               url: '/console/pokemon-japanese-alolan-moonlight' },
    { name: 'Japanese Battle Rainbow',                 url: '/console/pokemon-japanese-battle-rainbow' },
    { name: 'Japanese Darkness that Consumes Light',   url: '/console/pokemon-japanese-darkness-that-consumes-light' },
    { name: 'Japanese Awakened Heroes',                url: '/console/pokemon-japanese-awakened-heroes' },
    { name: 'Japanese Ultradimensional Beasts',        url: '/console/pokemon-japanese-ultradimensional-beastss' },
    { name: 'Japanese Ultra Sun',                      url: '/console/pokemon-japanese-ultra-sun' },
    { name: 'Japanese Forbidden Light',                url: '/console/pokemon-japanese-forbidden-light' },
    { name: 'Japanese Sky-Splitting Charisma',         url: '/console/pokemon-japanese-sky-splitting-charisma' },
    { name: 'Japanese Super-Burst Impact',             url: '/console/pokemon-japanese-super-burst-impact' },
    { name: 'Japanese Sword',                          url: '/console/pokemon-japanese-sword' },
    { name: 'Japanese Shield',                         url: '/console/pokemon-japanese-shield' },
    { name: 'Japanese Rebel Clash',                    url: '/console/pokemon-japanese-rebel-clash' },
    { name: 'Japanese Infinity Zone',                  url: '/console/pokemon-japanese-infinity-zone' },
    { name: 'Japanese Single Strike Master',           url: '/console/pokemon-japanese-single-strike-master' },
    { name: 'Japanese Rapid Strike Master',            url: '/console/pokemon-japanese-rapid-strike-master' },
    { name: 'Japanese Silver Lance',                   url: '/console/pokemon-japanese-silver-lance' },
    { name: 'Japanese Jet-Black Spirit',               url: '/console/pokemon-japanese-jet-black-spirit' },
    { name: 'Japanese Skyscraping Perfection',         url: '/console/pokemon-japanese-skyscraping-perfection' },
    { name: 'Japanese Dragon Selection',               url: '/console/pokemon-japanese-dragon-selection' },
    { name: 'Japanese SM1',                            url: '/console/pokemon-japanese-sm1' },
    { name: 'Japanese Facing a New Trial',             url: '/console/pokemon-japanese-facing-a-new-trial' },
    { name: 'Japanese Ultra Force',                    url: '/console/pokemon-japanese-ultra-force' },
    { name: 'Japanese Dragon Storm',                   url: '/console/pokemon-japanese-dragon-storm' },
    { name: 'Japanese Champion Road',                  url: '/console/pokemon-japanese-champion-road' },
    { name: 'Japanese Thunderclap Spark',              url: '/console/pokemon-japanese-thunderclap-spark' },
    { name: 'Japanese Fairy Rise',                     url: '/console/pokemon-japanese-fairy-rise' },
    { name: 'Japanese Dark Order',                     url: '/console/pokemon-japanese-dark-order' },
    { name: 'Japanese Full Metal Wall',                url: '/console/pokemon-japanese-full-metal-wall' },
    { name: 'Japanese VMAX Rising',                    url: '/console/pokemon-japanese-vmax-rising' },
    { name: 'Japanese Explosive Walker',               url: '/console/pokemon-japanese-explosive-walker' },
    { name: 'Japanese Legendary Heartbeat',            url: '/console/pokemon-japanese-legendary-heartbeat' },
];
// ────────────────────────────────────────────────────────────────────

function parsePrice(text) {
    if (!text) return null;
    const cleaned = text.replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? null : num;
}

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } catch (e) {
            if (i === retries - 1) throw e;
            await sleep(5000 * (i + 1));
        }
    }
}

function parseCardsFromPage($, set) {
    const cards = [];
    $('#games_table tbody tr[id^="product-"]').each((_, row) => {
        const $row = $(row);
        const $link = $row.find('td.title a').first();
        const name = $link.text().trim();
        const cardUrl = $link.attr('href');
        if (!name || !cardUrl) return;

        const $img = $row.find('td.image img');
        const image = $img.attr('src') || $img.attr('data-src') || null;

        const tds = $row.find('td');
        const priceRaw = parsePrice(tds.eq(2).text());
        const priceGrade9 = parsePrice(tds.eq(3).text());
        const priceGrade95 = parsePrice(tds.eq(4).text());
        const pricePSA10 = parsePrice(tds.eq(5).text());

        const setId = set.url.split('/').pop().split('?')[0];
        const cardId = `pc-${setId}-${cardUrl.split('/').pop()}`;

        cards.push({
            id: cardId,
            name,
            image: image?.startsWith('http') ? image : (image ? `${BASE_URL}${image}` : null),
            priceRaw,
            priceGrade9,
            priceGrade95,
            pricePSA10,
            currency: 'USD',
            set: set.name,
            setId,
            cardType: 'single',
            sourceUrl: `${BASE_URL}${cardUrl}`,
            link: `${BASE_URL}${cardUrl}`,
            updatedAt: new Date(),
        });
    });
    return cards;
}

async function scrapeSet(set) {
    let page = 1;
    let totalCards = 0;
    const seenIds = new Set();

    while (true) {
        const url = `${BASE_URL}${set.url}${set.url.includes('?') ? '&' : '?'}q=&sort=name&page=${page}`;
        let html;
        try { html = await fetchWithRetry(url); } catch (e) {
            console.log(`  ✗ fetch failed: ${e.message}`);
            break;
        }

        const $ = cheerio.load(html);
        const cards = parseCardsFromPage($, set);
        if (cards.length === 0) break;

        // Detect duplicate page (pagination loop)
        const firstId = cards[0]?.id;
        if (firstId && seenIds.has(firstId)) break;
        cards.forEach(c => seenIds.add(c.id));

        // Upsert
        const ops = cards.map(card => ({
            updateOne: {
                filter: { id: card.id },
                update: { $set: card, $setOnInsert: { createdAt: new Date() } },
                upsert: true
            }
        }));
        await Card.bulkWrite(ops);
        totalCards += cards.length;

        const hasNext = $('a[rel="next"]').length > 0 || $('li.next a').length > 0;
        if (!hasNext || page >= 50) break;
        page++;
        await sleep(DELAY);
    }
    return totalCards;
}

async function main() {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected. Importing ${SETS.length} sets...\n`);

    let totalImported = 0;
    let success = 0;

    for (let i = 0; i < SETS.length; i++) {
        const set = SETS[i];
        process.stdout.write(`[${i + 1}/${SETS.length}] ${set.name}... `);
        try {
            const count = await scrapeSet(set);
            console.log(`✓ ${count} cards`);
            totalImported += count;
            success++;
        } catch (e) {
            console.log(`✗ ${e.message}`);
        }
        await sleep(DELAY);
    }

    console.log(`\n✅ Done: ${success}/${SETS.length} sets, ${totalImported} cards imported/updated.`);
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
