import { auth } from '@clerk/nextjs/server';
import { updateCollectionItem } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { cardId, purchasePrice, items } = body;

        if (!cardId) {
            return NextResponse.json({ error: 'Missing cardId' }, { status: 400 });
        }

        const updateData = {};
        if (items !== undefined) {
            console.log(`[API] Updating items for ${cardId}:`, items);
            updateData.items = items;
        }
        if (purchasePrice !== undefined) updateData.purchasePrice = purchasePrice;

        const success = await updateCollectionItem(userId, cardId, updateData);
        console.log(`[API] Update result for ${cardId}:`, success);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Item not found in collection' }, { status: 404 });
        }
    } catch (error) {
        console.error('Update collection error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
