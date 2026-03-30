import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';

// Public: GET /api/disclaimer
export async function GET() {
    try {
        await connectToDatabase();
        const doc = await SiteConfig.findOne({ key: 'disclaimer' }).lean();
        return NextResponse.json({ content: doc?.value || '' });
    } catch (error) {
        console.error('[DISCLAIMER_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
