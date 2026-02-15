
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import MerchantProfile from '@/models/MerchantProfile';
import Listing from '@/models/Listing';
import Card from '@/models/Card';

export async function GET(req, { params }) {
    try {
        const { id } = await params; // merchant userId

        await connectToDatabase();

        // 1. Fetch Profile
        const profile = await MerchantProfile.findOne({ userId: id, isActive: true }).lean();

        if (!profile) {
            return new NextResponse('Shop not found', { status: 404 });
        }

        // 2. Fetch Listings
        const listings = await Listing.find({ merchantId: id, stock: { $gt: 0 } }).lean();

        // 3. Enrich Listings with Card Data (Image, Name, etc.)
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
                // Ensure we return the merchant's price, not market price
                price: l.price,
                stock: l.stock,
                condition: l.condition
            };
        });

        return NextResponse.json({
            profile,
            listings: enrichedListings
        });

    } catch (error) {
        console.error('[SHOP_DETAIL_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
