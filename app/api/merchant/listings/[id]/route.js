import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Listing from '@/models/Listing';

// PATCH /api/merchant/listings/[id]
// action: 'delist' | 'sold'
export async function PATCH(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { action, soldPrice, soldChannel } = body;

        await connectToDatabase();

        // ── Delist: permanently remove the listing record
        if (action === 'delist') {
            const result = await Listing.deleteOne({ _id: id, merchantId: userId });
            if (result.deletedCount === 0) {
                console.error(`[MERCHANT_LISTING_PATCH] Delist not found: id=${id} userId=${userId}`);
                return new NextResponse('Not found', { status: 404 });
            }
            return NextResponse.json({ success: true, action: 'delist' });
        }

        // ── Sold: keep the record but mark as sold (stock=0 + sale details)
        if (action === 'sold') {
            if (!soldPrice) return new NextResponse('Missing soldPrice', { status: 400 });
            const result = await Listing.findOneAndUpdate(
                { _id: id, merchantId: userId },
                {
                    $set: {
                        stock: 0,
                        soldPrice: parseFloat(soldPrice),
                        soldChannel: soldChannel || 'other',
                        soldAt: new Date(),
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );
            if (!result) {
                console.error(`[MERCHANT_LISTING_PATCH] Sold not found: id=${id} userId=${userId}`);
                return new NextResponse('Not found', { status: 404 });
            }
            return NextResponse.json({ success: true, action: 'sold' });
        }

        return new NextResponse('Invalid action', { status: 400 });

    } catch (error) {
        console.error('[MERCHANT_LISTING_PATCH]', error);
        return new NextResponse(error.message, { status: 500 });
    }
}
