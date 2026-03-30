import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';

// Admin only: PUT /api/admin/disclaimer
export async function PUT(req) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { content } = await req.json();
        await connectToDatabase();

        await SiteConfig.findOneAndUpdate(
            { key: 'disclaimer' },
            { $set: { value: content, updatedAt: new Date() } },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DISCLAIMER_PUT]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
