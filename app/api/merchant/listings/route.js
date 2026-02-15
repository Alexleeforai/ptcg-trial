
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Listing from '@/models/Listing';
import Card from '@/models/Card';

// Helper to ensure DB connection
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

        // Fetch listings for this merchant
        const listings = await Listing.find({ merchantId: userId }).lean();

        // Enrich with card details
        // Optimization: Get all unique cardIds and fetch Cards in one go
        const cardIds = listings.map(l => l.cardId);
        const cards = await Card.find({ id: { $in: cardIds } }).lean();
        const cardMap = new Map(cards.map(c => [c.id, c]));

        const enrichedListings = listings.map(l => {
            const card = cardMap.get(l.cardId) || {};

            // Determine market price based on condition
            let marketConf = card.priceRaw || 0; // Default to Raw
            if (l.condition === 'PSA 10') {
                marketConf = card.pricePSA10 || card.priceRaw || 0;
            } else if (l.condition === 'PSA 9') {
                marketConf = card.priceGrade9 || card.priceRaw || 0;
            } else {
                marketConf = card.priceRaw || card.price || 0;
            }

            // marketBuy = approximate buy price (e.g. what shops pay)
            // marketSell = approximate retail price (what shops sell for)
            // For now, let's treat the PriceCharting price as "Retail Market Value" (Sell)
            // And Buy as ~70% of that.
            const sellRef = marketConf;
            const buyRef = Math.round(sellRef * 0.7);

            return {
                ...l,
                // Add card details for UI
                image: card.image || '',
                name: card.name || 'Unknown Card',
                set: card.set || '',
                marketBuy: buyRef,
                marketSell: sellRef
            };
        });

        return NextResponse.json(enrichedListings);

    } catch (error) {
        console.error('[MERCHANT_LISTINGS_GET]', error);
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
        const { cardId, price, stock, condition } = body;

        if (!cardId) {
            return new NextResponse('Missing cardId', { status: 400 });
        }

        await db();

        // Upsert listing ensuring merchantId is strictly the authenticated user
        const listing = await Listing.findOneAndUpdate(
            { merchantId: userId, cardId },
            {
                $set: {
                    price: parseFloat(price) || 0,
                    stock: parseInt(stock) || 0,
                    condition: condition || 'NM',
                    updatedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json(listing);

    } catch (error) {
        console.error('[MERCHANT_LISTINGS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const url = new URL(req.url);
        const cardId = url.searchParams.get('cardId');

        if (!cardId) {
            return new NextResponse('Missing cardId', { status: 400 });
        }

        await db();

        // Delete only if it matches merchantId
        await Listing.deleteOne({ merchantId: userId, cardId });

        return new NextResponse('Deleted', { status: 200 });

    } catch (error) {
        console.error('[MERCHANT_LISTINGS_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
