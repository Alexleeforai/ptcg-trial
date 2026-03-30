
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

        // Fetch listings for this merchant (exclude sold/delisted stock=0)
        const listings = await Listing.find({ merchantId: userId, stock: { $gt: 0 } }).lean();

        // Enrich with card details
        // Optimization: Get all unique cardIds and fetch Cards in one go
        const cardIds = listings.map(l => l.cardId);
        const cards = await Card.find({ id: { $in: cardIds } }).lean();
        const cardMap = new Map(cards.map(c => [c.id, c]));

        const enrichedListings = listings.map(l => {
            const card = cardMap.get(l.cardId) || {};

            let marketConf = card.priceRaw || 0;
            if (l.condition === 'PSA 10') {
                marketConf = card.pricePSA10 || card.priceRaw || 0;
            } else if (l.condition === 'PSA 9') {
                marketConf = card.priceGrade9 || card.priceRaw || 0;
            } else {
                marketConf = card.priceRaw || card.price || 0;
            }

            const sellRef = marketConf;
            const buyRef = Math.round(sellRef * 0.7);

            return {
                ...l,
                _id: l._id.toString(), // always a clean string for the frontend
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
        const { cardId, price, stock, condition, listingId } = body;

        await db();

        if (listingId) {
            // ── Edit existing listing ── (cardId not needed, already in DB)
            const result = await Listing.findOneAndUpdate(
                { _id: listingId, merchantId: userId },
                {
                    $set: {
                        price: parseFloat(price) || 0,
                        stock: parseInt(stock) || 0,
                        condition: condition || 'Raw',
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );
            if (!result) {
                console.error('[MERCHANT_LISTINGS_POST] Edit: listing not found', { listingId, userId });
                return new NextResponse('Listing not found', { status: 404 });
            }
            return NextResponse.json(result);
        }

        // ── New listing ──
        if (!cardId) {
            return new NextResponse('Missing cardId', { status: 400 });
        }

        const listing = await Listing.findOneAndUpdate(
            { merchantId: userId, cardId, condition: condition || 'Raw' },
            {
                $set: {
                    cardId,
                    price: parseFloat(price) || 0,
                    stock: parseInt(stock) || 0,
                    condition: condition || 'Raw',
                    updatedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json(listing);

    } catch (error) {
        console.error('[MERCHANT_LISTINGS_POST]', error.message, error.code);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
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
