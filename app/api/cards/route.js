
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const setId = searchParams.get('setId');
        const idsParam = searchParams.get('ids'); // comma-separated card ids

        await connectToDatabase();

        // Batch lookup by ids (for Recently Viewed refresh)
        if (idsParam) {
            const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20);
            if (ids.length === 0) return NextResponse.json([]);
            const cards = await Card.find({ id: { $in: ids } })
                .select('id name image price currency snkrdunkProductId snkrdunkPricePSA10 snkrdunkPricePSA9 snkrdunkPriceUsd snkrdunkPricePSA10Usd snkrdunkPricePSA9Usd')
                .lean();
            return NextResponse.json(cards);
        }

        if (!setId) {
            return new NextResponse('Set ID or ids Required', { status: 400 });
        }

        const cards = await Card.find({ setId })
            .select('id name image number price priceRaw pricePSA10 priceGrade9')
            .sort({ number: 1 })
            .lean();

        return NextResponse.json(cards);

    } catch (error) {
        console.error('[CARDS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
