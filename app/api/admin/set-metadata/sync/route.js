import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';
import SetMetadata from '@/models/SetMetadata';

function detectLanguage(name = '') {
    if (/japanese/i.test(name)) return 'japanese';
    if (/chinese|traditional|simplified/i.test(name)) return 'chinese';
    return 'english';
}

// POST: scan Card collection, auto-create SetMetadata docs for missing setIds
export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

        await connectToDatabase();

        // Get all unique sets from Card collection
        const cardSets = await Card.aggregate([
            { $group: { _id: { $ifNull: ['$setId', '$set'] }, name: { $first: '$set' } } }
        ]);

        // Get existing SetMetadata setIds
        const existingMeta = await SetMetadata.find({}, 'setId').lean();
        const existingIds = new Set(existingMeta.map(m => m.setId));

        // Create missing ones
        const newSets = cardSets.filter(s => !existingIds.has(s._id));
        let created = 0;

        if (newSets.length > 0) {
            const docs = newSets.map(s => ({
                setId: s._id,
                name: s.name || s._id,
                language: detectLanguage(s.name || ''),
                releaseDate: null,
                coverImage: ''
            }));
            await SetMetadata.insertMany(docs, { ordered: false });
            created = docs.length;
        }

        return NextResponse.json({ success: true, created, total: cardSets.length });
    } catch (error) {
        console.error('[SET_META_SYNC]', error);
        return new NextResponse(error.message, { status: 500 });
    }
}
