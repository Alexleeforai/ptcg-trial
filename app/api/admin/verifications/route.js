import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
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

        // Check if the user is an admin
        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        // This assumes you use Clerk's publicMetadata for roles. Adjust as necessary.
        if (user.publicMetadata?.role !== 'admin') {
            return new NextResponse('Forbidden: Admins only', { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'pending'; // Filter by status

        await db();

        // Find merchants matching the requested verification status
        const query = {};
        if (status !== 'all') {
            query.verificationStatus = status;
        } else {
            // If "all", exclude unsubmitted
            query.verificationStatus = { $ne: 'unsubmitted' };
        }

        const merchants = await MerchantProfile.find(query).sort({ updatedAt: -1 }).lean();

        return NextResponse.json(merchants);
    } catch (error) {
        console.error('[ADMIN_VERIFICATIONS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
