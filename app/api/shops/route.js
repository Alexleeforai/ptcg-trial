
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import MerchantProfile from '@/models/MerchantProfile';

export async function GET(req) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const isAdminRequest = searchParams.get('admin') === 'true';

        let isAdminUser = false;

        if (isAdminRequest) {
            // Verify the user is actually an admin
            const { userId } = await auth();
            if (userId) {
                const client = await clerkClient();
                const user = await client.users.getUser(userId);
                if (user.publicMetadata?.role === 'admin') {
                    isAdminUser = true;
                }
            }
        }

        const query = isAdminUser ? {} : { isActive: true };

        const shops = await MerchantProfile.find(query)
            .select('userId shopName shopIcon description instagram phone logoUrl verificationStatus isActive')
            .lean();

        return NextResponse.json(shops);
    } catch (error) {
        console.error('[SHOPS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
