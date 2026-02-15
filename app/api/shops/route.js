
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import MerchantProfile from '@/models/MerchantProfile';

export async function GET() {
    try {
        await connectToDatabase();

        const shops = await MerchantProfile.find({ isActive: true })
            .select('userId shopName shopIcon description instagram logoUrl')
            .lean();

        return NextResponse.json(shops);
    } catch (error) {
        console.error('[SHOPS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
