import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import MerchantProfile from '@/models/MerchantProfile';

async function db() {
    await connectToDatabase();
}

export async function PUT(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Check if the user is an admin
        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        if (user.publicMetadata?.role !== 'admin') {
            return new NextResponse('Forbidden: Admins only', { status: 403 });
        }

        const resolvedParams = await params;
        const merchantId = resolvedParams.id; // Corrected: Await params
        const body = await req.json();
        const { action } = body;

        let status;
        if (action === 'approve') {
            status = 'approved';
        } else if (action === 'reject') {
            status = 'rejected';
        } else {
            return new NextResponse('Invalid action. Must be approve or reject', { status: 400 });
        }

        await db();

        const profile = await MerchantProfile.findByIdAndUpdate(
            merchantId,
            {
                $set: { verificationStatus: status }
            },
            { new: true }
        );

        if (!profile) {
            return new NextResponse('Merchant not found', { status: 404 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('[ADMIN_VERIFICATIONS_PUT]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
