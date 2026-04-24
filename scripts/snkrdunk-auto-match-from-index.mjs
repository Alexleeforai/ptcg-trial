/**
 * Auto match cards using SnkrdunkIndex (setCode + cardNum).
 *
 * Usage:
 *   node scripts/snkrdunk-auto-match-from-index.mjs --dry-run=true
 *   node scripts/snkrdunk-auto-match-from-index.mjs --limit=5000
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Card from '../models/Card.js';
import SnkrdunkIndex from '../models/SnkrdunkIndex.js';

dotenv.config({ path: '.env.local' });

function parseArgs() {
    const args = Object.fromEntries(
        process.argv.slice(2).map((a) => {
            const [k, v = 'true'] = a.replace(/^--/, '').split('=');
            return [k, v];
        })
    );
    return {
        dryRun: args['dry-run'] === 'true',
        limit: Math.max(0, Number(args.limit || 0)),
        overwriteAuto: args['overwrite-auto'] !== 'false', // default true
    };
}

function parseCardNum(card) {
    if (card.number) {
        const m = String(card.number).match(/#?\s*0*(\d+)\s*$/);
        if (m) return Number(m[1]);
    }
    const mName = (card.name || '').match(/#\s*0*(\d+)\s*$/i);
    if (mName) return Number(mName[1]);
    const mRatio = (card.name || '').match(/\b(\d{1,3})\s*\/\s*(\d{1,3})\b/);
    if (mRatio) return Number(mRatio[1]);
    return null;
}

async function loadIndexMap() {
    // Group by (setCodeLower, cardNum) to avoid duplicates.
    const grouped = await SnkrdunkIndex.aggregate([
        { $match: { setCodeLower: { $exists: true, $ne: '' }, cardNum: { $gt: 0 } } },
        { $sort: { productId: 1 } },
        {
            $group: {
                _id: { setCodeLower: '$setCodeLower', cardNum: '$cardNum' },
                productId: { $first: '$productId' },
                name: { $first: '$name' },
            },
        },
    ]);
    const map = new Map();
    for (const row of grouped) {
        map.set(`${row._id.setCodeLower}#${row._id.cardNum}`, {
            productId: row.productId,
            name: row.name || '',
        });
    }
    return map;
}

async function main() {
    const args = parseArgs();
    await mongoose.connect(process.env.MONGODB_URI);

    const indexMap = await loadIndexMap();
    if (indexMap.size === 0) {
        throw new Error('SnkrdunkIndex is empty. Run snkrdunk-build-index first.');
    }

    const matchQuery = {};
    if (!args.overwriteAuto) {
        matchQuery.$or = [{ snkrdunkProductId: { $exists: false } }, { snkrdunkProductId: 0 }];
    } else {
        matchQuery.$or = [
            { snkrdunkProductId: { $exists: false } },
            { snkrdunkProductId: 0 },
            { snkrdunkAutoMatched: true },
        ];
    }

    let cursor = Card.find(matchQuery)
        .select('id name number setCode snkrdunkProductId snkrdunkAutoMatched')
        .lean();
    if (args.limit > 0) cursor = cursor.limit(args.limit);
    const cards = await cursor;

    let matched = 0;
    let manualLockedSkipped = 0;
    let noSetCode = 0;
    let noCardNum = 0;
    let noIndexHit = 0;
    const ops = [];

    for (const card of cards) {
        if (card.snkrdunkProductId > 0 && card.snkrdunkAutoMatched === false) {
            manualLockedSkipped++;
            continue;
        }

        const setCode = (card.setCode || '').trim().toLowerCase();
        if (!setCode) {
            noSetCode++;
            continue;
        }
        const cardNum = parseCardNum(card);
        if (!cardNum || cardNum <= 0) {
            noCardNum++;
            continue;
        }

        const key = `${setCode}#${cardNum}`;
        const hit = indexMap.get(key);
        if (!hit) {
            noIndexHit++;
            continue;
        }

        matched++;
        if (!args.dryRun) {
            ops.push({
                updateOne: {
                    filter: { id: card.id },
                    update: {
                        $set: {
                            snkrdunkProductId: hit.productId,
                            snkrdunkName: hit.name,
                            snkrdunkAutoMatched: true,
                            updatedAt: new Date(),
                        },
                    },
                },
            });
        }
    }

    if (!args.dryRun && ops.length > 0) {
        await Card.bulkWrite(ops, { ordered: false });
    }

    console.log(
        JSON.stringify(
            {
                dryRun: args.dryRun,
                overwriteAuto: args.overwriteAuto,
                indexKeys: indexMap.size,
                scannedCards: cards.length,
                matched,
                manualLockedSkipped,
                noSetCode,
                noCardNum,
                noIndexHit,
                wroteUpdates: args.dryRun ? 0 : ops.length,
            },
            null,
            2
        )
    );

    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error('[snkrdunk-auto-match-from-index] failed:', err);
    try {
        await mongoose.disconnect();
    } catch {}
    process.exit(1);
});

