import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';

/**
 * GET /api/admin/match-stats
 * Returns per-set match progress: total cards, matched count, unmatched list.
 * Query params:
 *   ?setCode=sv8a  → include unmatched card names for that specific set
 */
export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const focusSet = searchParams.get('setCode');

        await connectToDatabase();

        // Aggregate per-set stats
        const stats = await Card.aggregate([
            { $group: {
                _id: '$setCode',
                total: { $sum: 1 },
                matched: { $sum: { $cond: [{ $gt: ['$snkrdunkProductId', 0] }, 1, 0] } },
                setName: { $first: '$set' },
            }},
            { $project: {
                setCode: '$_id',
                setName: 1,
                total: 1,
                matched: 1,
                unmatched: { $subtract: ['$total', '$matched'] },
                pct: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$matched', '$total'] }, 0] }
            }},
            { $sort: { unmatched: -1, setCode: 1 } }
        ]);

        // If a specific set is requested, also return unmatched card names
        let unmatchedCards = null;
        if (focusSet) {
            unmatchedCards = await Card.find(
                { setCode: focusSet, $or: [{ snkrdunkProductId: { $exists: false } }, { snkrdunkProductId: 0 }] },
                { id: 1, name: 1, number: 1, _id: 0 }
            ).sort({ name: 1 }).lean();
        }

        return NextResponse.json({ stats, unmatchedCards });
    } catch (err) {
        console.error('[match-stats]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
