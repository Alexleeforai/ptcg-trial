import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';

/**
 * GET /api/admin/match-review
 * Returns two categories of suspicious cards:
 *   A) Has snkrdunkProductId but price is 0 / noQuote after fetch attempt
 *   B) Price is >10x the set average (likely matched to a wrong expensive card)
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

        await connectToDatabase();

        // Category A: Has ID + was fetched (snkrdunkUpdatedAt set) but price is 0
        const noQuote = await Card.find(
            {
                snkrdunkProductId: { $exists: true, $gt: 0 },
                snkrdunkUpdatedAt: { $exists: true },
                $or: [
                    { snkrdunkPriceHkd: { $exists: false } },
                    { snkrdunkPriceHkd: 0 },
                    { snkrdunkPriceHkd: null },
                ]
            },
            { id: 1, name: 1, number: 1, setCode: 1, set: 1, snkrdunkProductId: 1, snkrdunkUpdatedAt: 1, _id: 0 }
        ).sort({ setCode: 1, name: 1 }).limit(500).lean();

        // Category B: Price anomaly — price > 10x set average
        // First compute per-set avg price
        const setAvgs = await Card.aggregate([
            {
                $match: {
                    snkrdunkPriceHkd: { $exists: true, $gt: 0 },
                    setCode: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$setCode',
                    avgHkd: { $avg: '$snkrdunkPriceHkd' },
                    count: { $sum: 1 }
                }
            },
            { $match: { count: { $gte: 3 } } } // only sets with enough data
        ]);

        const avgBySet = {};
        for (const row of setAvgs) {
            avgBySet[row._id] = row.avgHkd;
        }

        const setCodes = Object.keys(avgBySet);
        const anomalies = await Card.find(
            {
                setCode: { $in: setCodes },
                snkrdunkPriceHkd: { $exists: true, $gt: 0 }
            },
            { id: 1, name: 1, number: 1, setCode: 1, set: 1, snkrdunkProductId: 1, snkrdunkPriceHkd: 1, _id: 0 }
        ).lean();

        const priceAnomalies = anomalies
            .filter(c => {
                const avg = avgBySet[c.setCode];
                return avg && c.snkrdunkPriceHkd > avg * 10;
            })
            .map(c => ({ ...c, setAvgHkd: Math.round(avgBySet[c.setCode]) }))
            .sort((a, b) => b.snkrdunkPriceHkd - a.snkrdunkPriceHkd)
            .slice(0, 200);

        return NextResponse.json({ noQuote, priceAnomalies });
    } catch (err) {
        console.error('[match-review]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
