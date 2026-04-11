import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';
import { autoMatchOneCard, sleep, SLEEP_MS as SNK_AUTO_DELAY_MS } from '@/lib/snkrdunkAutoMatch';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * POST /api/admin/snkrdunk-auto-match
 * Body: { setId: string, maxCards?: number, dryRun?: boolean, replaceAuto?: boolean }
 *
 * - default: only cards with no snkrdunkProductId (or ≤0)
 * - replaceAuto: also re-run for rows where snkrdunkAutoMatched === true (keep manual rows untouched)
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
        const setId = (body.setId || '').trim();
        const maxCards = Math.min(80, Math.max(1, Number(body.maxCards) || 50));
        const dryRun = !!body.dryRun;
        const replaceAuto = !!body.replaceAuto;

        if (setId.length < 3) {
            return NextResponse.json({ error: 'setId 至少 3 個字' }, { status: 400 });
        }

        await connectToDatabase();

        const rid = new RegExp(escapeRegex(setId), 'i');

        const noId = {
            $or: [
                { snkrdunkProductId: { $exists: false } },
                { snkrdunkProductId: null },
                { snkrdunkProductId: { $lte: 0 } }
            ]
        };

        const autoRow = { snkrdunkAutoMatched: true, snkrdunkProductId: { $gt: 0 } };

        const filter = replaceAuto
            ? { $and: [{ setId: rid }, { $or: [noId, autoRow] }] }
            : { $and: [{ setId: rid }, noId] };

        const cards = await Card.find(filter).sort({ name: 1 }).limit(maxCards).lean();

        const summary = {
            dryRun,
            replaceAuto,
            setId,
            scanned: cards.length,
            matched: 0,
            skipped: 0,
            failed: 0,
            samples: []
        };

        for (const card of cards) {
            const manualLocked =
                card.snkrdunkProductId > 0 &&
                card.snkrdunkAutoMatched === false;
            if (manualLocked) {
                summary.skipped++;
                continue;
            }

            try {
                const best = await autoMatchOneCard(card);
                await sleep(dryRun ? 120 : SNK_AUTO_DELAY_MS);

                if (!best) {
                    summary.skipped++;
                    continue;
                }

                if (dryRun) {
                    summary.matched++;
                    if (summary.samples.length < 15) {
                        summary.samples.push({
                            cardId: card.id,
                            name: card.name,
                            snkrdunkProductId: best.id,
                            snkrdunkName: best.name
                        });
                    }
                    continue;
                }

                await Card.updateOne(
                    { id: card.id },
                    {
                        $set: {
                            snkrdunkProductId: best.id,
                            snkrdunkAutoMatched: true,
                            updatedAt: new Date()
                        }
                    }
                );
                summary.matched++;
                if (summary.samples.length < 15) {
                    summary.samples.push({
                        cardId: card.id,
                        name: card.name,
                        snkrdunkProductId: best.id,
                        snkrdunkName: best.name
                    });
                }
            } catch {
                summary.failed++;
            }
        }

        return NextResponse.json({ success: true, ...summary });
    } catch (error) {
        console.error('[SNKRDUNK_AUTO_MATCH]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
