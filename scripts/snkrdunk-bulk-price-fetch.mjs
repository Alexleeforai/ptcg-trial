/**
 * snkrdunk-bulk-price-fetch.mjs
 *
 * Fetches SNKRDUNK prices for all matched cards that have no price yet.
 * Runs locally — much faster than relying on the Vercel cron (40/run).
 *
 * Usage:
 *   node scripts/snkrdunk-bulk-price-fetch.mjs [--batch=50] [--delay=700] [--sets=sv8a,sv2a]
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { fetchSnkrdunkTradingCardQuote } from '../lib/snkrdunk.js';

const args = process.argv.slice(2);
const BATCH = parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '50', 10);
const DELAY = parseInt(args.find(a => a.startsWith('--delay='))?.split('=')[1] || '700', 10);
const setFilter = args.find(a => a.startsWith('--sets='))?.split('=')[1]?.split(',').map(s => s.trim());

const sleep = ms => new Promise(r => setTimeout(r, ms));

const CardSchema = new mongoose.Schema({}, { strict: false });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Card = mongoose.model('Card', CardSchema, 'cards');

  // Find all matched cards never price-checked (snkrdunkUpdatedAt not set)
  const query = {
    snkrdunkProductId: { $exists: true, $gt: 0 },
    snkrdunkUpdatedAt: { $exists: false },
  };
  if (setFilter?.length) {
    query.setCode = { $in: setFilter };
  }

  const total = await Card.countDocuments(query);
  console.log(`[bulk-price-fetch] Cards to fetch: ${total} (batch=${BATCH}, delay=${DELAY}ms)`);
  if (total === 0) { console.log('Nothing to do!'); await mongoose.disconnect(); return; }

  let processed = 0, ok = 0, noQuote = 0, errors = 0;
  const startTime = Date.now();

  // Process in batches
  let skip = 0;
  while (true) {
    const cards = await Card.find(query)
      .sort({ snkrdunkUpdatedAt: 1 })
      .skip(skip)
      .limit(BATCH)
      .select({ id: 1, snkrdunkProductId: 1, setCode: 1, name: 1 })
      .lean();

    if (cards.length === 0) break;

    for (const card of cards) {
      try {
        const quote = await fetchSnkrdunkTradingCardQuote(card.snkrdunkProductId);
        if (!quote || quote.priceJpy <= 0) {
          noQuote++;
          // Mark currency='JPY' price=0 so query won't keep re-fetching this card
          await Card.updateOne({ id: card.id }, { $set: { currency: 'JPY', price: 0, snkrdunkUpdatedAt: new Date() } });
        } else {
          const setFields = {
            price: quote.priceJpy,
            currency: 'JPY',
            snkrdunkUpdatedAt: new Date(),
            updatedAt: new Date(),
          };
          if (quote.priceHkd != null)       setFields.snkrdunkPriceHkd      = quote.priceHkd;
          if (quote.priceUsd != null)       setFields.snkrdunkPriceUsd      = quote.priceUsd;
          if (quote.pricePSA10Hkd != null)  setFields.snkrdunkPricePSA10Hkd = quote.pricePSA10Hkd;
          if (quote.pricePSA9Hkd != null)   setFields.snkrdunkPricePSA9Hkd  = quote.pricePSA9Hkd;
          if (quote.pricePSA10Jpy != null)  setFields.snkrdunkPricePSA10    = quote.pricePSA10Jpy;
          if (quote.pricePSA9Jpy != null)   setFields.snkrdunkPricePSA9     = quote.pricePSA9Jpy;
          if (quote.pricePSA10Usd != null)  setFields.snkrdunkPricePSA10Usd = quote.pricePSA10Usd;
          if (quote.pricePSA9Usd != null)   setFields.snkrdunkPricePSA9Usd  = quote.pricePSA9Usd;
          await Card.updateOne({ id: card.id }, { $set: setFields });
          ok++;
        }
        processed++;
        if (processed % 20 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          const rate = (processed / elapsed * 60).toFixed(0);
          console.log(`  [${processed}/${total}] ok=${ok} noQuote=${noQuote} err=${errors} | ${rate}/min | ~${Math.ceil((total-processed)/rate*60/60)}min left`);
        }
      } catch (e) {
        errors++;
        processed++;
        if (e.message?.includes('Too Many Requests')) {
          console.log('  [rate limited] waiting 30s...');
          await sleep(30000);
        }
      }
      await sleep(DELAY);
    }

    // Re-query since we're updating records (use skip on remaining unpriced)
    skip = 0; // Always re-query from top since we mark fetched records
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n══ DONE ══ ${elapsed}min`);
  console.log(`ok=${ok} noQuote=${noQuote} errors=${errors} total=${processed}`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
