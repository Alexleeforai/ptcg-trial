/**
 * Link a DB card to SNKRDUNK and optionally fetch quote once.
 *
 * Usage:
 *   node scripts/snkrdunk-link-card.js <cardId> <snkrdunkProductId> [--fetch]
 *
 * Example:
 *   node scripts/snkrdunk-link-card.js pc-some-set-slug 780928 --fetch
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Card from '../models/Card.js';
import { fetchSnkrdunkTradingCardQuote } from '../lib/snkrdunk.js';

dotenv.config({ path: '.env.local' });

async function main() {
    const args = process.argv.slice(2);
    const fetchNow = args.includes('--fetch');
    const pos = args.filter((a) => a !== '--fetch');
    const [cardId, rawPid] = pos;

    if (!cardId || !rawPid) {
        console.error('Usage: node scripts/snkrdunk-link-card.js <cardId> <snkrdunkProductId> [--fetch]');
        process.exit(1);
    }

    const pid = Number(rawPid);
    if (!Number.isFinite(pid) || pid <= 0) {
        console.error('Invalid snkrdunkProductId');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const update = { $set: { snkrdunkProductId: pid } };

    if (fetchNow) {
        const quote = await fetchSnkrdunkTradingCardQuote(pid);
        if (!quote) {
            console.error('Failed to fetch SNKRDUNK quote (check product id / network).');
            process.exit(1);
        }
        update.$set.price = quote.priceJpy;
        update.$set.currency = 'JPY';
        update.$set.snkrdunkUpdatedAt = new Date();
        update.$set.updatedAt = new Date();
        console.log('Quote:', quote);
    }

    const res = await Card.updateOne({ id: cardId }, update);
    if (res.matchedCount === 0) {
        console.error('Card not found:', cardId);
        process.exit(1);
    }

    console.log('Updated', cardId, 'snkrdunkProductId =', pid);
    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
