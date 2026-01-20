import { searchCards } from '@/lib/data';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
        return NextResponse.json({ results: [] });
    }

    // Limit to 5-8 results for suggestions, Sorted by Price High -> Low
    const allResults = await searchCards(q);

    // Sort: Cards with price > 0 first, sorted desc. Then cards with 0 price.
    // Using basePriceJPY as proxy.
    allResults.sort((a, b) => {
        const priceA = a.basePriceJPY || 0;
        const priceB = b.basePriceJPY || 0;
        return priceB - priceA;
    });

    const suggestions = allResults.slice(0, 8).map(card => ({
        id: card.id,
        name: card.name,
        nameJP: card.nameJP,
        nameCN: card.nameCN,
        nameEN: card.nameEN,
        image: card.image,
        set: card.set,
        number: card.number,
        price: card.basePriceJPY // Pass price to frontend if needed logic
    }));

    return NextResponse.json({ results: suggestions });
}
