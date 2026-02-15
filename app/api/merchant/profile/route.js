
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import MerchantProfile from '@/models/MerchantProfile';

async function db() {
    await connectToDatabase();
}

export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await db();

        const profile = await MerchantProfile.findOne({ userId }).lean();

        if (!profile) {
            return NextResponse.json(null); // No profile yet
        }

        return NextResponse.json(profile);

    } catch (error) {
        console.error('[MERCHANT_PROFILE_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        console.log('[MERCHANT_PROFILE_POST] Received body:', { ...body, shopIcon: body.shopIcon ? 'Base64 String present' : 'Missing' });

        // Basic validation
        if (!body.shopName) {
            return new NextResponse('Shop Name is required', { status: 400 });
        }

        await db();

        const profile = await MerchantProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    ...body,
                    userId, // Enforce userId
                    updatedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json(profile);

    } catch (error) {
        console.error('[MERCHANT_PROFILE_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
