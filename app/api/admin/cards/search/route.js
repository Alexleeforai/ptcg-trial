import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { findCards } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX = 40;

/**
 * GET /api/admin/cards/search?q=...
 * Admin-only: search local DB cards for SNKRDUNK mapping UI.
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
        if (q.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const dbResults = await findCards(q, 'all');
        const results = dbResults.slice(0, MAX).map((c) => ({
            id: c.id,
            name: c.name,
            set: c.set,
            number: c.number || '',
            snkrdunkProductId: c.snkrdunkProductId ?? null,
            snkrdunkUpdatedAt: c.snkrdunkUpdatedAt || null,
            price: c.price,
            priceRaw: c.priceRaw,
            currency: c.currency,
            image: c.image
        }));

        return NextResponse.json({ results });
    } catch (error) {
        console.error('[ADMIN_CARDS_SEARCH]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
