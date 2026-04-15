import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { findCards } from '@/lib/db';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';
import { resolveAdminSetScope, escapeRegex } from '@/lib/adminSetScope';

export const dynamic = 'force-dynamic';

const MAX_TEXT = 120;
/** 單一 setId／setCode 範圍一次最多載入張數（日本大型 set 可超過 200） */
const MAX_SET = 6000;

function mapCard(c) {
    return {
        id: c.id,
        name: c.name,
        set: c.set,
        number: c.number || '',
        setId: c.setId || '',
        setCode: c.setCode || '',
        snkrdunkProductId: c.snkrdunkProductId ?? null,
        snkrdunkName: c.snkrdunkName || '',
        snkrdunkAutoMatched: !!c.snkrdunkAutoMatched,
        snkrdunkUpdatedAt: c.snkrdunkUpdatedAt || null,
        price: c.price,
        priceRaw: c.priceRaw,
        currency: c.currency,
        image: c.image
    };
}

/**
 * GET /api/admin/cards/search?q=...&setId=...&unsetOnly=1
 * Admin-only. Use setId (≥3 chars) to list cards in set (max MAX_SET per request): setCode exact first, else setId regex.
 * Text-only: q must be ≥2 chars.
 */
export async function GET(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const q = (searchParams.get('q') || '').trim();
        const setId = (searchParams.get('setId') || '').trim();
        const unsetOnly = searchParams.get('unsetOnly') === '1';
        const autoMatchedOnly = searchParams.get('autoMatchedOnly') === '1';

        if (setId.length < 2 && q.length < 2 && !autoMatchedOnly) {
            return NextResponse.json({ results: [], hint: '輸入至少 2 字關鍵字，或填 setId（至少 2 字）' });
        }

        let raw = [];
        let setScopeMeta = null;
        let totalInSet;

        if (setId.length >= 2) {
            await connectToDatabase();
            const scope = await resolveAdminSetScope(Card, setId);
            if (!scope.ok) {
                if (scope.reason === 'ambiguous_set_code') {
                    return NextResponse.json({
                        results: [],
                        total: 0,
                        capped: false,
                        hint: scope.message,
                        ambiguousSetIds: scope.setIds
                    });
                }
                return NextResponse.json({
                    results: [],
                    total: 0,
                    capped: false,
                    hint: scope.message || '輸入太短'
                });
            }

            setScopeMeta = {
                input: setId,
                resolvedVia: scope.resolvedVia,
                canonicalSetId: scope.canonicalSetId || null
            };

            const setKey = scope.setCodeQuery
                ? { setCode: scope.setCodeQuery }
                : { setId: scope.setIdQuery };
            let mongoFilter;
            if (autoMatchedOnly) {
                const autoFilter = { snkrdunkAutoMatched: true, snkrdunkProductId: { $gt: 0 } };
                mongoFilter = { $and: [setKey, autoFilter] };
            } else if (unsetOnly) {
                mongoFilter = {
                    $and: [
                        setKey,
                        {
                            $or: [
                                { snkrdunkProductId: { $exists: false } },
                                { snkrdunkProductId: null },
                                { snkrdunkProductId: { $lte: 0 } }
                            ]
                        }
                    ]
                };
            } else {
                mongoFilter = setKey;
            }

            const totalInSet = await Card.countDocuments(mongoFilter);
            raw = await Card.find(mongoFilter).sort({ name: 1 }).limit(MAX_SET).lean();

            if (q.length >= 2) {
                const rx = new RegExp(escapeRegex(q), 'i');
                const qLo = q.trim().toLowerCase();
                raw = raw.filter((c) => {
                    const codeLo = String(c.setCode || '').trim().toLowerCase();
                    return (
                        rx.test(c.name || '') ||
                        rx.test(c.nameJP || '') ||
                        rx.test(c.nameEN || '') ||
                        rx.test(c.set || '') ||
                        rx.test(String(c.number || '')) ||
                        (codeLo.length > 0 && codeLo === qLo)
                    );
                });
            }
        } else {
            await connectToDatabase();
            if (autoMatchedOnly) {
                // 全庫「待確認」模式（無指定系列）
                raw = await Card.find({
                    snkrdunkAutoMatched: true,
                    snkrdunkProductId: { $gt: 0 }
                }).sort({ name: 1 }).limit(MAX_TEXT).lean();
            } else {
                raw = await findCards(q, 'all');
                if (unsetOnly) {
                    raw = raw.filter((c) => {
                        const p = c.snkrdunkProductId;
                        return p == null || p === '' || Number(p) <= 0;
                    });
                }
            }
        }

        const max = setId.length >= 2 ? MAX_SET : MAX_TEXT;
        const results = raw.slice(0, max).map(mapCard);
        const totalMatching = raw.length;
        const setCapped = setId.length >= 2 && totalInSet != null && totalInSet > MAX_SET;

        return NextResponse.json({
            results,
            total: totalMatching,
            totalInSet: setId.length >= 2 ? totalInSet : undefined,
            capped: setCapped || (setId.length < 2 && raw.length > max),
            setScope: setScopeMeta
        });
    } catch (error) {
        console.error('[ADMIN_CARDS_SEARCH]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
