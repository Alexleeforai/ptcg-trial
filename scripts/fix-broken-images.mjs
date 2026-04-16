/**
 * fix-broken-images.mjs
 * Scans all cards whose image URL returns 404, fetches the correct URL
 * from PriceCharting, and updates the database.
 *
 * Usage: node scripts/fix-broken-images.mjs [--dry-run] [--limit 500]
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const CONCURRENCY = 8;
const DELAY_MS = 300;
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv[find('--limit') + 1] || '0');

function find(flag) {
    const i = process.argv.indexOf(flag);
    return i === -1 ? 99999 : i;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const Card = mongoose.model('Card', new mongoose.Schema({}, { strict: false }));

async function checkUrl(url) {
    try {
        const r = await fetch(url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(5000),
        });
        return r.status === 200;
    } catch {
        return false;
    }
}

async function fetchCorrectImageFromPriceCharting(pcUrl) {
    try {
        const r = await fetch(pcUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) return null;
        const html = await r.text();
        const m = html.match(/https:\/\/storage\.googleapis\.com\/images\.pricecharting\.com\/([^/"'\s]+)\/(?:240|60)\.jpg/);
        if (!m) return null;
        return `https://storage.googleapis.com/images.pricecharting.com/${m[1]}/60.jpg`;
    } catch {
        return null;
    }
}

function buildPriceChartingUrl(card) {
    // Build slug from card id like "pc-pokemon-japanese-vstar-universe-giratina-vstar-261"
    if (card._id?.toString().startsWith('pc-')) {
        const slug = card._id.toString().replace(/^pc-/, '').replace(/-(\d+)$/, '/$1');
        return `https://www.pricecharting.com/game/${slug}`;
    }
    return null;
}

async function runBatch(cards) {
    const results = { fixed: 0, unfixable: 0, skipped: 0 };
    for (const card of cards) {
        const ok = await checkUrl(card.image);
        if (ok) { results.skipped++; continue; }

        const pcUrl = buildPriceChartingUrl(card);
        if (!pcUrl) {
            console.log(`  ✗ No PC URL for: ${card.name} (${card._id})`);
            results.unfixable++;
            continue;
        }

        await sleep(DELAY_MS);
        const newImage = await fetchCorrectImageFromPriceCharting(pcUrl);
        if (!newImage) {
            console.log(`  ✗ No image found: ${card.name}`);
            results.unfixable++;
            continue;
        }

        console.log(`  ✓ ${card.name}: ${card.image.split('/').slice(-2).join('/')} → ${newImage.split('/').slice(-2).join('/')}`);
        if (!DRY_RUN) {
            await Card.updateOne({ _id: card._id }, { $set: { image: newImage } });
        }
        results.fixed++;
    }
    return results;
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(DRY_RUN ? '[DRY RUN]' : '[LIVE]', 'Scanning for broken images...\n');

    const query = Card.find({ image: /storage\.googleapis\.com/ }).select('_id name set image');
    if (LIMIT > 0) query.limit(LIMIT);
    const cards = await query.lean();

    console.log(`Found ${cards.length} cards to check\n`);

    let fixed = 0, unfixable = 0, skipped = 0;
    for (let i = 0; i < cards.length; i += CONCURRENCY) {
        const batch = cards.slice(i, i + CONCURRENCY);
        const r = await runBatch(batch);
        fixed += r.fixed; unfixable += r.unfixable; skipped += r.skipped;
        if ((i + CONCURRENCY) % 100 === 0) {
            console.log(`  Progress: ${i + CONCURRENCY}/${cards.length} | fixed=${fixed} unfixable=${unfixable} skipped=${skipped}`);
        }
    }

    console.log(`\nDone. Fixed: ${fixed}, Unfixable: ${unfixable}, Already OK: ${skipped}`);
    await mongoose.disconnect();
}

main().catch(console.error);
