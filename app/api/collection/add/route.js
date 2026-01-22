import { auth } from '@clerk/nextjs/server';
import { addToCollection } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { cardId } = await request.json();

        if (!cardId) {
            return NextResponse.json(
                { error: 'Card ID is required' },
                { status: 400 }
            );
        }

        const result = await addToCollection(userId, cardId);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error adding to collection:', error);
        return NextResponse.json(
            { error: 'Failed to add to collection' },
            { status: 500 }
        );
    }
}
