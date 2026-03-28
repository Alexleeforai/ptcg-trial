
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import MerchantProfile from '@/models/MerchantProfile';
import Listing from '@/models/Listing';
import Card from '@/models/Card';

async function isAdminUser() {
    const { userId } = await auth();
    if (!userId) return false;
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.publicMetadata?.role === 'admin';
}

export async function GET(req, { params }) {
    try {
        const { id } = await params; // merchant userId
        const admin = await isAdminUser();

        await connectToDatabase();

        // 1. Fetch Profile — admins can see hidden shops too
        const query = admin
            ? { userId: id }
            : { userId: id, isActive: true };

        const profile = await MerchantProfile.findOne(query).lean();

        if (!profile) {
            return new NextResponse('Shop not found', { status: 404 });
        }

        // 2. Fetch Listings
        const listings = await Listing.find({ merchantId: id, stock: { $gt: 0 } }).lean();

        // 3. Enrich Listings with Card Data
        const cardIds = listings.map(l => l.cardId);
        const cards = await Card.find({ id: { $in: cardIds } }).lean();
        const cardMap = new Map(cards.map(c => [c.id, c]));

        const enrichedListings = listings.map(l => {
            const card = cardMap.get(l.cardId) || {};
            return {
                ...l,
                image: card.image,
                name: card.name,
                set: card.set,
                number: card.number,
                price: l.price,
                stock: l.stock,
                condition: l.condition
            };
        });

        return NextResponse.json({
            profile,
            listings: enrichedListings,
            isAdmin: admin,
        });

    } catch (error) {
        console.error('[SHOP_DETAIL_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

