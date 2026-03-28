import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import MerchantProfile from '@/models/MerchantProfile';

async function requireAdmin() {
    const { userId } = await auth();
    if (!userId) return { error: 'Unauthorized', status: 401 };

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (user.publicMetadata?.role !== 'admin') return { error: 'Forbidden', status: 403 };

    return { userId };
}

// PATCH /api/admin/shops/[id] — toggle isActive
export async function PATCH(req, { params }) {
    const check = await requireAdmin();
    if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

    try {
        await connectToDatabase();
        const { id } = await params;

        const shop = await MerchantProfile.findById(id);
        if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

        shop.isActive = !shop.isActive;
        await shop.save();

        return NextResponse.json({ success: true, isActive: shop.isActive });
    } catch (error) {
        console.error('[ADMIN_SHOP_PATCH]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/shops/[id] — permanently delete shop
export async function DELETE(req, { params }) {
    const check = await requireAdmin();
    if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

    try {
        await connectToDatabase();
        const { id } = await params;

        const shop = await MerchantProfile.findByIdAndDelete(id);
        if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[ADMIN_SHOP_DELETE]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
