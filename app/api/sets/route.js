
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';

export async function GET() {
    try {
        await connectToDatabase();

        // Aggregate to get unique sets
        const sets = await Card.aggregate([
            {
                $group: {
                    _id: "$setId",
                    name: { $first: "$set" },
                    code: { $first: "$setCode" }, // Get the set code
                    count: { $sum: 1 }
                }
            },
            { $sort: { name: 1 } }
        ]);

        return NextResponse.json(sets.map(s => ({
            id: s._id,
            name: s.name,
            code: s.code, // Return code
            count: s.count
        })));

    } catch (error) {
        console.error('[SETS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
