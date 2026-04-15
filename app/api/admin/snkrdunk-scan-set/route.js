import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch a SNKRDUNK product page and extract bracket info [CODE num/denom] + name.
 * Returns null if not a valid trading card page.
 */
async function fetchProductInfo(productId) {
    try {
        const res = await fetch(`https://snkrdunk.com/en/trading-cards/${productId}`, {
            headers: { 'User-Agent': UA, Accept: 'text/html' },
            signal: AbortSignal.timeout(8000)
        });
        if (res.status === 404) return null;
        if (!res.ok) return null;
        const html = await res.text();
        const bracketMatch = html.match(/\[([A-Za-z0-9]+)\s+(\d+)\/(\d+)\]/);
        if (!bracketMatch) return null;
        const titleMatch = html.match(/<title>([^<]*)/);
        const name = titleMatch ? titleMatch[1].split('|')[0].trim() : '';
        return {
            productId: Number(productId),
            setCode: bracketMatch[1],
            cardNum: parseInt(bracketMatch[2], 10),
            denom: parseInt(bracketMatch[3], 10),
            name
        };
    } catch {
        return null;
    }
}

/**
 * Scan in one direction (step = +1 or -1) until GAP_LIMIT consecutive non-matches.
 * Returns map of productId -> info for cards matching targetSetCode.
 */
async function scanDirection(startId, step, targetSetCode, gapLimit = 30, concurrency = 5) {
    const found = new Map();
    let id = startId;
    let consecutiveMisses = 0;

    while (consecutiveMisses < gapLimit) {
        // Build a batch of IDs
        const batchIds = [];
        for (let i = 0; i < concurrency; i++) {
            batchIds.push(id);
            id += step;
        }

        const results = await Promise.all(batchIds.map((bid) => fetchProductInfo(bid)));
        let hadMatch = false;
        for (const info of results) {
            if (info && info.setCode.toLowerCase() === targetSetCode.toLowerCase()) {
                found.set(info.productId, info);
                consecutiveMisses = 0;
                hadMatch = true;
            } else {
                consecutiveMisses++;
            }
        }
        // Reset consecutive miss count if any in batch matched
        if (hadMatch) consecutiveMisses = 0;
    }

    return found;
}

/**
 * POST /api/admin/snkrdunk-scan-set
 * Body: { seedProductId: 730202, dryRun?: true }
 *
 * Scans product IDs adjacent to seedProductId (both directions) to find all
 * cards with the same set code, then optionally writes snkrdunkProductId to DB.
 */
export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const seedProductId = parseInt(body.seedProductId, 10);
        const dryRun = body.dryRun !== false; // default true
        const overwriteManual = !!body.overwriteManual; // default false

        if (!Number.isFinite(seedProductId) || seedProductId <= 0) {
            return NextResponse.json({ error: '請提供有效嘅 seedProductId（正整數）' }, { status: 400 });
        }

        // Step 1: fetch seed to get set code
        const seedInfo = await fetchProductInfo(seedProductId);
        if (!seedInfo) {
            return NextResponse.json(
                { error: `Product ${seedProductId} 唔係有效嘅 SNKRDUNK 卡頁，或者無 [CODE num/denom] 格式` },
                { status: 400 }
            );
        }

        const targetSetCode = seedInfo.setCode;

        // Step 2: scan in both directions from seed
        const [forwardMap, backwardMap] = await Promise.all([
            scanDirection(seedProductId + 1, +1, targetSetCode),
            scanDirection(seedProductId - 1, -1, targetSetCode)
        ]);

        // Merge all found cards
        const allFound = new Map();
        allFound.set(seedInfo.productId, seedInfo);
        for (const [k, v] of forwardMap) allFound.set(k, v);
        for (const [k, v] of backwardMap) allFound.set(k, v);

        // Build lookup by card number
        // cardNum -> { productId, name }
        const byCardNum = new Map();
        for (const info of allFound.values()) {
            byCardNum.set(info.cardNum, { productId: info.productId, name: info.name });
        }

        const scanSummary = {
            setCode: targetSetCode,
            scannedProductIds: allFound.size,
            cardNumsFound: [...byCardNum.keys()].sort((a, b) => a - b),
            minProductId: Math.min(...allFound.keys()),
            maxProductId: Math.max(...allFound.keys())
        };

        if (dryRun) {
            return NextResponse.json({
                success: true,
                dryRun: true,
                ...scanSummary,
                matched: 0,
                skipped: 0,
                samples: [...allFound.values()].slice(0, 20).map((i) => ({
                    productId: i.productId,
                    cardNum: i.cardNum,
                    name: i.name
                }))
            });
        }

        // Step 3: write to DB
        await connectToDatabase();

        // Find all DB cards with this setCode
        const dbCards = await Card.find({ setCode: new RegExp(`^${targetSetCode}$`, 'i') })
            .select('id name number setCode snkrdunkProductId snkrdunkAutoMatched')
            .lean();

        let matched = 0;
        let skipped = 0;
        let noMatch = 0;
        const samples = [];

        for (const dbCard of dbCards) {
            // Skip manually locked cards (unless overwriteManual)
            if (!overwriteManual && dbCard.snkrdunkProductId > 0 && dbCard.snkrdunkAutoMatched === false) {
                skipped++;
                continue;
            }

            // Parse card number from DB card
            const numStr = dbCard.number || '';
            const parsed = parseInt(numStr.replace(/\D.*$/, ''), 10);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                // Try extracting from name
                const nameMatch = (dbCard.name || '').match(/#\s*0*(\d+)\s*$/i);
                if (!nameMatch) {
                    noMatch++;
                    continue;
                }
                const numFromName = parseInt(nameMatch[1], 10);
                const snkInfo = byCardNum.get(numFromName);
                if (!snkInfo) { noMatch++; continue; }

                await Card.updateOne(
                    { id: dbCard.id },
                    { $set: { snkrdunkProductId: snkInfo.productId, snkrdunkName: snkInfo.name, snkrdunkAutoMatched: true, updatedAt: new Date() } }
                );
                matched++;
                if (samples.length < 20) samples.push({ cardId: dbCard.id, name: dbCard.name, productId: snkInfo.productId, snkrdunkName: snkInfo.name });
                continue;
            }

            const snkInfo = byCardNum.get(parsed);
            if (!snkInfo) {
                noMatch++;
                continue;
            }

            await Card.updateOne(
                { id: dbCard.id },
                { $set: { snkrdunkProductId: snkInfo.productId, snkrdunkName: snkInfo.name, snkrdunkAutoMatched: true, updatedAt: new Date() } }
            );
            matched++;
            if (samples.length < 20) samples.push({ cardId: dbCard.id, name: dbCard.name, productId: snkInfo.productId, snkrdunkName: snkInfo.name });
        }

        return NextResponse.json({
            success: true,
            dryRun: false,
            ...scanSummary,
            dbCardsTotal: dbCards.length,
            matched,
            skipped,
            noMatch,
            samples
        });
    } catch (error) {
        console.error('[SNKRDUNK_SCAN_SET]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
