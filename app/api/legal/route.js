import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

const VALID_KEYS = ['disclaimer', 'tos', 'privacy', 'external-links'];

// Public: GET /api/legal?key=tos
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (!key || !VALID_KEYS.includes(key)) {
        return new NextResponse('Invalid key', { status: 400 });
    }
    try {
        await connectToDatabase();
        const doc = await SiteConfig.findOne({ key }).lean();
        return NextResponse.json({ content: doc?.value || '' });
    } catch (error) {
        console.error('[LEGAL_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// Admin: PUT /api/legal?key=tos
export async function PUT(req) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        if (!key || !VALID_KEYS.includes(key)) {
            return new NextResponse('Invalid key', { status: 400 });
        }

        const { content } = await req.json();
        await connectToDatabase();
        await SiteConfig.findOneAndUpdate(
            { key },
            { $set: { value: content, updatedAt: new Date() } },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[LEGAL_PUT]', error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}
