
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const setId = searchParams.get('setId');

        if (!setId) {
            return new NextResponse('Set ID Required', { status: 400 });
        }

        await connectToDatabase();

        const cards = await Card.find({ setId })
            .select('id name image number price priceRaw pricePSA10 priceGrade9') // Select necessary fields
            .sort({ number: 1 }) // Sort by number (might need alpha-numeric sort logic later)
            .lean();

        return NextResponse.json(cards);

    } catch (error) {
        console.error('[CARDS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
