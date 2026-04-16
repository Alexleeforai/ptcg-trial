import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';
import SetMetadata from '@/models/SetMetadata';

async function requireAdmin() {
    const { userId } = await auth();
    if (!userId) return null;
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.publicMetadata?.role === 'admin' ? userId : null;
}

function detectLanguage(name = '') {
    if (/japanese/i.test(name)) return 'japanese';
    if (/chinese|traditional|simplified/i.test(name)) return 'chinese';
    return 'english';
}

// GET: list all set metadata merged with card counts
export async function GET(req) {
    const adminId = await requireAdmin();
    if (!adminId) return new NextResponse('Forbidden', { status: 403 });

    await connectToDatabase();

    // Get all unique sets from cards
    const cardSets = await Card.aggregate([
        { $group: { _id: { $ifNull: ['$setId', '$set'] }, name: { $first: '$set' }, count: { $sum: 1 }, sampleImage: { $first: '$image' } } },
        { $sort: { name: 1 } }
    ]);

    // Get all metadata
    const metaDocs = await SetMetadata.find({}).lean();
    const metaMap = new Map(metaDocs.map(m => [m.setId, m]));

    const result = cardSets.map(s => {
        const meta = metaMap.get(s._id) || {};
        return {
            setId: s._id,
            name: meta.name || s.name || s._id,
            count: s.count,
            sampleImage: s.sampleImage,
            language: meta.language || '',
            releaseDate: meta.releaseDate ? meta.releaseDate.toISOString().split('T')[0] : '',
            coverImage: meta.coverImage || '',
            coverImagePosition: meta.coverImagePosition || '50% 50%',
            coverImageZoom: meta.coverImageZoom || 1,
            hasMetadata: !!metaMap.get(s._id)
        };
    });

    return NextResponse.json({ sets: result });
}

// PUT: update a single set metadata
export async function PUT(req) {
    const adminId = await requireAdmin();
    if (!adminId) return new NextResponse('Forbidden', { status: 403 });

    const { setId, language, releaseDate, coverImage, coverImagePosition, coverImageZoom } = await req.json();
    if (!setId) return new NextResponse('Missing setId', { status: 400 });

    await connectToDatabase();

    await SetMetadata.findOneAndUpdate(
        { setId },
        { $set: { language, releaseDate: releaseDate || null, coverImage: coverImage || '', coverImagePosition: coverImagePosition || '50% 50%', coverImageZoom: coverImageZoom || 1, updatedAt: new Date() } },
        { upsert: true, strict: false }
    );

    return NextResponse.json({ success: true });
}
