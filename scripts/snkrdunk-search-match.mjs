/**
 * snkrdunk-search-match.mjs
 *
 * Uses SNKRDUNK's EN search API to find all product IDs for each set,
 * then matches them to local Card documents.
 *
 * Usage:
 *   node scripts/snkrdunk-search-match.mjs [--sets sv8a,sv2a,...] [--dry-run] [--delay 400]
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const delayMs = parseInt(args.find(a => a.startsWith('--delay='))?.split('=')[1] || '350', 10);
const setFilter = args.find(a => a.startsWith('--sets='))?.split('=')[1]?.split(',').map(s => s.trim().toLowerCase());

// ── Target sets with known seed IDs (for verification) ───────────────────────
const TARGET_SETS = [
  // ── Scarlet & Violet ─────────────────────────────────────────────────
  { code: 'sv8a', snkrCode: 'SV8a' },   // Terastal Festival ex
  { code: 'sv2a', snkrCode: 'SV2a' },   // 151
  { code: 'sv4a', snkrCode: 'SV4a' },   // Shiny Treasure ex
  { code: 's12a', snkrCode: 'S12a' },   // VSTAR Universe
  { code: 'sv7a', snkrCode: 'SV7a' },   // Paradise Dragona
  { code: 'sv6a', snkrCode: 'SV6a' },   // Mask of Change
  { code: 'sv5a', snkrCode: 'SV5a' },   // Crimson Haze
  { code: 'sv3a', snkrCode: 'SV3a' },   // Raging Surf
  { code: 'sv5M', snkrCode: 'SV5M' },   // Cyber Judge
  { code: 'sv4M', snkrCode: 'SV4M' },   // Wild Force
  { code: 'sv9a', snkrCode: 'SV9a' },   // Heat Wave Arena
  { code: 'sv10', snkrCode: 'SV10' },   // Glory of Team Rocket
  { code: 'sv11b', snkrCode: 'SV11B' }, // Black Bolt
  { code: 'sv11W', snkrCode: 'SV11W' }, // White Flare
  { code: 'sv1s', snkrCode: 'SV1S' },   // Scarlet ex
  { code: 'sv1V', snkrCode: 'SV1V' },   // Violet ex
  { code: 'sv2', snkrCode: 'SV2' },     // Clay Burst
  { code: 'sv3', snkrCode: 'SV3' },     // Ruler of the Black Flame
  { code: 'sv4', snkrCode: 'SV4' },     // Pale Moon ex
  { code: 'sv5', snkrCode: 'SV5' },     // Wild Force/Cyber Judge
  { code: 'sv6', snkrCode: 'SV6' },     // Transformation Mask
  { code: 'sv7', snkrCode: 'SV7' },     // Stellar Miracle
  { code: 'sv8', snkrCode: 'SV8' },     // Super Electric Breaker
  { code: 'sv9', snkrCode: 'SV9' },     // Journey Partners
  // ── Sword & Shield ───────────────────────────────────────────────────
  { code: 'sm12a', snkrCode: 'SM12a' }, // Tag All Stars
  { code: 's8b', snkrCode: 's8b' },     // VMAX Climax
  { code: 's4a', snkrCode: 's4a' },     // Shiny Star V
  { code: 'sm8b', snkrCode: 'SM8b' },   // GX Ultra Shiny
  { code: 's12', snkrCode: 'S12' },     // Paradigm Trigger
  { code: 's11a', snkrCode: 'S11a' },   // Dark Phantasma
  { code: 's10a', snkrCode: 'S10a' },   // Dark Phantasma
  { code: 's9a', snkrCode: 'S9a' },     // Battle Region
  { code: 's8a', snkrCode: 's8a' },     // VMAX Climax (25th)
  { code: 's7D', snkrCode: 'S7D' },     // Skyscraping Perfection
  { code: 's6a', snkrCode: 'S6a' },     // Silver Lance/Jet-Black Spirit
  { code: 's5a', snkrCode: 'S5a' },
  // ── XY ───────────────────────────────────────────────────────────────
  { code: 'xy1', snkrCode: 'XY1' },
  { code: 'xy2', snkrCode: 'XY2' },
  { code: 'xy3', snkrCode: 'XY3' },
  { code: 'XY3', snkrCode: 'XY3' },     // some DB entries uppercase
  { code: 'xy5', snkrCode: 'XY5' },
  { code: 'xy6', snkrCode: 'XY6' },
  { code: 'XY4', snkrCode: 'XY4' },
  { code: 'xy4', snkrCode: 'XY4' },
  { code: 'xy7', snkrCode: 'XY7' },
  { code: 'XY7', snkrCode: 'XY7' },
  { code: 'xy8', snkrCode: 'XY8' },
  { code: 'XY8', snkrCode: 'XY8' },
  { code: 'xy9', snkrCode: 'XY9' },
  { code: 'XY9', snkrCode: 'XY9' },
  { code: 'xy10', snkrCode: 'XY10' },
  { code: 'XY10', snkrCode: 'XY10' },
  { code: 'xy11', snkrCode: 'XY11' },
  { code: 'xy12', snkrCode: 'XY12' },
  { code: 'XY12', snkrCode: 'XY12' },
  // ── BW ───────────────────────────────────────────────────────────────
  { code: 'bw1', snkrCode: 'BW1' },
  { code: 'bw2', snkrCode: 'BW2' },
  { code: 'bw3', snkrCode: 'BW3' },
  { code: 'bw4', snkrCode: 'BW4' },
  { code: 'bw5', snkrCode: 'BW5' },
  { code: 'bw6', snkrCode: 'BW6' },
  { code: 'bw7', snkrCode: 'BW7' },
  { code: 'bw8', snkrCode: 'BW8' },
  { code: 'BW1', snkrCode: 'BW1' },
  // ── DP ───────────────────────────────────────────────────────────────
  { code: 'DP1', snkrCode: 'DP1' },
  { code: 'DP2', snkrCode: 'DP2' },
  { code: 'DP3', snkrCode: 'DP3' },
  { code: 'DP4', snkrCode: 'DP4' },
  { code: 'DP5', snkrCode: 'DP5' },
  { code: 'DP6', snkrCode: 'DP6' },
  // ── SM ───────────────────────────────────────────────────────────────
  { code: 'sm1', snkrCode: 'SM1' },
  { code: 'sm2', snkrCode: 'SM2' },
  { code: 'sm3', snkrCode: 'SM3' },
  { code: 'sm4', snkrCode: 'SM4' },
  { code: 'sm5', snkrCode: 'SM5' },
  { code: 'sm6', snkrCode: 'SM6' },
  { code: 'sm7', snkrCode: 'SM7' },
  { code: 'sm8', snkrCode: 'SM8' },
  { code: 'sm9', snkrCode: 'SM9' },
  { code: 'sm10', snkrCode: 'SM10' },
  { code: 'sm11', snkrCode: 'SM11' },
  { code: 'sm12', snkrCode: 'SM12' },
  // ── EBB/other ────────────────────────────────────────────────────────
  { code: 'EBB', snkrCode: 'EBB' },
  // ── Mega EX sets ─────────────────────────────────────────────────────
  { code: 'M1L', snkrCode: 'M1L' },
  { code: 'M1s', snkrCode: 'M1S' },
  // ── Others ───────────────────────────────────────────────────────────
  { code: 'JTG', snkrCode: 'JTG' },
  { code: '151c', snkrCode: '151c' },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Parse card number from SNKRDUNK product name.
 * e.g. "Bulbasaur C [SV2a 001/165]" → "001"
 */
function parseSnkrCardNum(name) {
  if (!name) return null;
  const m = name.match(/\[[\w\d]+ (\d{1,4}[A-Za-z]?)\/\d+\]/);
  return m ? m[1].replace(/^0+/, '') || '0' : null;
}

/**
 * Parse set code from SNKRDUNK product name.
 * e.g. "Bulbasaur C [SV2a 001/165]" → "SV2a"
 */
function parseSnkrSetCode(name) {
  if (!name) return null;
  const m = name.match(/\[([\w\d]+)\s+\d{1,4}/);
  return m ? m[1] : null;
}

/**
 * Fetch all SNKRDUNK products for a given set code via the search API.
 * Returns array of { id, name, setCode, cardNum }
 */
async function fetchSnkrdunkSet(snkrCode) {
  const results = [];
  let page = 1;
  const perPage = 50;

    while (true) {
    const url = `https://snkrdunk.com/en/v1/search?keyword=${encodeURIComponent(snkrCode)}&category=trading-card&perPage=${perPage}&page=${page}`;
    let data = null;
    // Retry up to 3 times on rate limit / error
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': UA, Accept: 'application/json', 'Accept-Language': 'ja-JP,ja;q=0.9' },
          cache: 'no-store'
        });
        if (res.status === 429) {
          console.log(`  [rate limited, waiting 30s...]`);
          await sleep(30000);
          continue;
        }
        if (!res.ok) { data = null; break; }
        const json = await res.json();
        if (json.message === 'Too Many Requests') {
          console.log(`  [rate limited, waiting 30s...]`);
          await sleep(30000);
          continue;
        }
        data = json;
        break;
      } catch (e) {
        console.error(`  [fetch error page ${page} attempt ${attempt}]`, e.message);
        if (attempt < 3) await sleep(5000);
      }
    }
    if (!data) break;

    const items = [...(data.sneakers || []), ...(data.streetwears || [])];
    if (items.length === 0) break;

    for (const item of items) {
      const nameSetCode = parseSnkrSetCode(item.name);
      // Only include cards that actually belong to this set
      if (!nameSetCode || nameSetCode.toLowerCase() !== snkrCode.toLowerCase()) continue;
      const cardNum = parseSnkrCardNum(item.name);
      if (!cardNum) continue;
      results.push({
        productId: item.id,
        name: item.name,
        setCode: nameSetCode,
        cardNum
      });
    }

    // If we got fewer than perPage, we're on the last page
    if (items.length < perPage) break;
    page++;
    await sleep(delayMs);
  }

  return results;
}

// ── DB setup ──────────────────────────────────────────────────────────────────
const CardSchema = new mongoose.Schema({
  id: String,
  name: String,
  set: String,
  setCode: String,
  number: String,
  snkrdunkProductId: Number,
  snkrdunkName: String,
  snkrdunkAutoMatched: Boolean,
  currency: String,
  price: Number,
}, { strict: false });

async function main() {
  console.log(`[snkrdunk-search-match] ${isDryRun ? '(DRY RUN) ' : ''}Starting...`);
  await mongoose.connect(process.env.MONGODB_URI);
  const Card = mongoose.model('Card', CardSchema, 'cards');

  const sets = TARGET_SETS.filter(s =>
    !setFilter || setFilter.includes(s.code.toLowerCase()) || setFilter.includes(s.snkrCode.toLowerCase())
  );
  // De-duplicate by snkrCode
  const seen = new Set();
  const uniqueSets = sets.filter(s => {
    if (seen.has(s.snkrCode.toLowerCase())) return false;
    seen.add(s.snkrCode.toLowerCase());
    return true;
  });

  let totalMatched = 0;
  let totalSkipped = 0;

  for (const setDef of uniqueSets) {
    console.log(`\n── ${setDef.code} (SNKRDUNK: ${setDef.snkrCode}) ──`);

    // Check how many unmatched cards we have for this set
    const unmatchedCount = await Card.countDocuments({
      setCode: setDef.code,
      cardType: 'single',
      $or: [{ snkrdunkProductId: { $exists: false } }, { snkrdunkProductId: { $lte: 0 } }]
    });

    if (unmatchedCount === 0) {
      console.log(`  ✓ All cards already matched, skipping`);
      continue;
    }
    console.log(`  Unmatched cards in DB: ${unmatchedCount}`);

    // Fetch all SNKRDUNK products for this set
    console.log(`  Fetching from SNKRDUNK...`);
    const snkrProducts = await fetchSnkrdunkSet(setDef.snkrCode);
    console.log(`  Found ${snkrProducts.length} products on SNKRDUNK`);

    if (snkrProducts.length === 0) {
      console.log(`  ⚠ No products found, skipping`);
      continue;
    }

    // Build lookup: cardNum → productId
    const numToProduct = {};
    for (const p of snkrProducts) {
      const key = String(parseInt(p.cardNum, 10)); // normalize: "001" → "1"
      if (!numToProduct[key]) {
        numToProduct[key] = p;
      }
    }

    // Fetch all unmatched cards for this set
    const cards = await Card.find({
      setCode: setDef.code,
      cardType: 'single',
      $or: [{ snkrdunkProductId: { $exists: false } }, { snkrdunkProductId: { $lte: 0 } }]
    }).lean();

    let setMatched = 0;
    let setSkipped = 0;

    for (const card of cards) {
      // Parse card number from card.number field
      let cardNumStr = null;
      if (card.number) {
        const m = String(card.number).match(/^(\d+)/);
        if (m) cardNumStr = String(parseInt(m[1], 10));
      }
      // Fallback: parse from card.name (e.g. "Bulbasaur #1" → "1")
      if (!cardNumStr && card.name) {
        const m = card.name.match(/#(\d+)/);
        if (m) cardNumStr = String(parseInt(m[1], 10));
      }

      if (!cardNumStr) {
        setSkipped++;
        continue;
      }

      const product = numToProduct[cardNumStr];
      if (!product) {
        setSkipped++;
        continue;
      }

      if (!isDryRun) {
        await Card.updateOne(
          { id: card.id },
          {
            $set: {
              snkrdunkProductId: product.productId,
              snkrdunkName: product.name,
              snkrdunkAutoMatched: true,
            }
          }
        );
      }
      console.log(`  ✓ ${card.name} #${cardNumStr} → SNK#${product.productId}`);
      setMatched++;
    }

    console.log(`  Set result: matched=${setMatched}, skipped=${setSkipped}`);
    totalMatched += setMatched;
    totalSkipped += setSkipped;

    await sleep(delayMs);
  }

  console.log(`\n══ DONE ══`);
  console.log(`Total matched: ${totalMatched}`);
  console.log(`Total skipped (no card number): ${totalSkipped}`);
  if (isDryRun) console.log('(DRY RUN - no changes written)');

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
