import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { findCards } from '@/lib/db';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';

export const dynamic = 'force-dynamic';

const MAX_TEXT = 120;
const MAX_SET = 200;

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mapCard(c) {
    return {
        id: c.id,
        name: c.name,
        set: c.set,
        number: c.number || '',
        setId: c.setId || '',
        setCode: c.setCode || '',
        snkrdunkProductId: c.snkrdunkProductId ?? null,
        snkrdunkUpdatedAt: c.snkrdunkUpdatedAt || null,
        price: c.price,
        priceRaw: c.priceRaw,
        currency: c.currency,
        image: c.image
    };
}

/**
 * GET /api/admin/cards/search?q=...&setId=...&unsetOnly=1
 * Admin-only. Use setId (≥3 chars) to list up to 200 cards in that set; optional q filters that list.
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

        if (setId.length < 3 && q.length < 2) {
            return NextResponse.json({ results: [], hint: '輸入至少 2 字關鍵字，或填 setId（至少 3 字）' });
        }

        let raw = [];

        if (setId.length >= 3) {
            await connectToDatabase();
            const rid = new RegExp(escapeRegex(setId), 'i');
            let mongoFilter;
            if (unsetOnly) {
                mongoFilter = {
                    $and: [
                        { setId: rid },
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
                mongoFilter = { setId: rid };
            }

            raw = await Card.find(mongoFilter).sort({ name: 1 }).limit(MAX_SET).lean();

            if (q.length >= 2) {
                const rx = new RegExp(escapeRegex(q), 'i');
                raw = raw.filter(
                    (c) =>
                        rx.test(c.name || '') ||
                        rx.test(c.nameJP || '') ||
                        rx.test(c.nameEN || '') ||
                        rx.test(c.set || '') ||
                        rx.test(String(c.number || '')) ||
                        rx.test(String(c.setCode || ''))
                );
            }
        } else {
            raw = await findCards(q, 'all');
            if (unsetOnly) {
                raw = raw.filter((c) => {
                    const p = c.snkrdunkProductId;
                    return p == null || p === '' || Number(p) <= 0;
                });
            }
        }

        const max = setId.length >= 3 ? MAX_SET : MAX_TEXT;
        const results = raw.slice(0, max).map(mapCard);

        return NextResponse.json({
            results,
            total: raw.length,
            capped: raw.length > max
        });
    } catch (error) {
        console.error('[ADMIN_CARDS_SEARCH]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
