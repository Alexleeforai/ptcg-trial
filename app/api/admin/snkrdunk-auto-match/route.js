import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';
import { autoMatchOneCard, sleep, SLEEP_MS as SNK_AUTO_DELAY_MS } from '@/lib/snkrdunkAutoMatch';
import { resolveAdminSetScope } from '@/lib/adminSetScope';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/admin/snkrdunk-auto-match
 * Body: { setId: string, maxCards?: number, dryRun?: boolean, replaceAuto?: boolean, afterMongoId?: string }
 *
 * Optional afterMongoId: previous batch last card _id (hex) for cursor pagination (sort _id asc).
 * Response includes nextAfterMongoId when another full batch may exist.
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
        const afterMongoId = (body.afterMongoId || '').trim();

        if (setId.length < 2) {
            return NextResponse.json({ error: 'setId 至少 2 個字' }, { status: 400 });
        }

        await connectToDatabase();

        const scope = await resolveAdminSetScope(Card, setId);
        if (!scope.ok) {
            if (scope.reason === 'ambiguous_set_code') {
                return NextResponse.json(
                    { success: false, error: scope.message, ambiguousSetIds: scope.setIds },
                    { status: 409 }
                );
            }
            return NextResponse.json({ success: false, error: scope.message || '輸入太短' }, { status: 400 });
        }

        const setKey = scope.setCodeQuery
            ? { setCode: scope.setCodeQuery }
            : { setId: scope.setIdQuery };

        const noId = {
            $or: [
                { snkrdunkProductId: { $exists: false } },
                { snkrdunkProductId: null },
                { snkrdunkProductId: { $lte: 0 } }
            ]
        };

        const autoRow = { snkrdunkAutoMatched: true, snkrdunkProductId: { $gt: 0 } };

        const filter = replaceAuto
            ? { $and: [setKey, { $or: [noId, autoRow] }] }
            : { $and: [setKey, noId] };

        let query = filter;
        if (afterMongoId) {
            if (!mongoose.Types.ObjectId.isValid(afterMongoId)) {
                return NextResponse.json({ error: '無效嘅分頁游標 afterMongoId' }, { status: 400 });
            }
            const oid = new mongoose.Types.ObjectId(afterMongoId);
            query = { $and: [filter, { _id: { $gt: oid } }] };
        }

        const cards = await Card.find(query).sort({ _id: 1 }).limit(maxCards).lean();

        const last = cards[cards.length - 1];
        let nextAfterMongoId = null;
        if (cards.length === maxCards && last?._id != null) {
            const hasMore = await Card.findOne({
                $and: [filter, { _id: { $gt: last._id } }]
            })
                .select('_id')
                .lean();
            if (hasMore) nextAfterMongoId = String(last._id);
        }

        const summary = {
            dryRun,
            replaceAuto,
            setId,
            resolvedVia: scope.resolvedVia,
            canonicalSetId: scope.canonicalSetId || null,
            scanned: cards.length,
            matched: 0,
            skipped: 0,
            failed: 0,
            samples: [],
            nextAfterMongoId,
            skipReasons: {
                manual_locked: 0,
                no_keyword: 0,
                no_card_index: 0,
                no_snk_results: 0,
                no_bracket_match: 0,
                multi_candidates: 0
            }
        };

        for (const card of cards) {
            const manualLocked =
                card.snkrdunkProductId > 0 &&
                card.snkrdunkAutoMatched === false;
            if (manualLocked) {
                summary.skipped++;
                summary.skipReasons.manual_locked++;
                continue;
            }

            try {
                const { match: best, skipReason } = await autoMatchOneCard(card);
                await sleep(dryRun ? 120 : SNK_AUTO_DELAY_MS);

                if (!best) {
                    summary.skipped++;
                    if (skipReason && summary.skipReasons[skipReason] != null) {
                        summary.skipReasons[skipReason]++;
                    }
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
                            snkrdunkName: best.name || '',
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
