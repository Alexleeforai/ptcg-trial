import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';
import { fetchSnkrdunkTradingCardQuote } from '@/lib/snkrdunk';

/**
 * PATCH /api/admin/cards/{cardId}/snkrdunk
 * Body: { "snkrdunkProductId": 780928 } | { "snkrdunkProductId": null } to clear
 * Optional: { "fetchNow": true } to pull quote immediately after save
 * Optional: { "confirm": true } to lock an auto-matched card without changing the ID
 * Optional: { "snkrdunkName": "…" } to store the product name
 */
export async function PATCH(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { cardId } = await params;
        const body = await req.json();
        const { snkrdunkProductId, fetchNow, confirm, snkrdunkName } = body;

        await connectToDatabase();

        // "確認正確" mode: just lock the auto-matched flag, keep everything else
        if (confirm === true) {
            const res = await Card.updateOne(
                { id: cardId },
                { $set: { snkrdunkAutoMatched: false, updatedAt: new Date() } }
            );
            if (res.matchedCount === 0) {
                return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
            }
            return NextResponse.json({ success: true, confirmed: true });
        }

        if (snkrdunkProductId === null || snkrdunkProductId === '') {
            await Card.updateOne(
                { id: cardId },
                {
                    $unset: { snkrdunkProductId: '', snkrdunkUpdatedAt: '', snkrdunkName: '' },
                    $set: { snkrdunkAutoMatched: false }
                }
            );
            return NextResponse.json({ success: true, cleared: true });
        }

        const pid = Number(snkrdunkProductId);
        if (!Number.isFinite(pid) || pid <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid snkrdunkProductId' }, { status: 400 });
        }

        const update = {
            $set: {
                snkrdunkProductId: pid,
                snkrdunkAutoMatched: false,
                ...(snkrdunkName ? { snkrdunkName } : {})
            }
        };
        let quote = null;

        if (fetchNow) {
            quote = await fetchSnkrdunkTradingCardQuote(pid);
            if (quote) {
                update.$set.price = quote.priceJpy;
                update.$set.currency = 'JPY';
                update.$set.snkrdunkUpdatedAt = new Date();
                update.$set.updatedAt = new Date();
                if (quote.pricePSA10Jpy != null) update.$set.snkrdunkPricePSA10 = quote.pricePSA10Jpy;
                if (quote.pricePSA9Jpy != null) update.$set.snkrdunkPricePSA9 = quote.pricePSA9Jpy;
                if (quote.priceUsd != null) update.$set.snkrdunkPriceUsd = quote.priceUsd;
                if (quote.pricePSA10Usd != null) update.$set.snkrdunkPricePSA10Usd = quote.pricePSA10Usd;
                if (quote.pricePSA9Usd != null) update.$set.snkrdunkPricePSA9Usd = quote.pricePSA9Usd;
            }
        }

        const res = await Card.updateOne({ id: cardId }, update);
        if (res.matchedCount === 0) {
            return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            snkrdunkProductId: pid,
            fetchNow: !!fetchNow,
            quote: quote
                ? {
                      priceJpy: quote.priceJpy,
                      minPrice: quote.minPrice,
                      currency: quote.currency
                  }
                : null
        });
    } catch (error) {
        console.error('[ADMIN_SNKRDUNK_PATCH]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
