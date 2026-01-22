import { auth } from '@clerk/nextjs/server';
import { removeFromCollection } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
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

        const result = await removeFromCollection(userId, cardId);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error removing from collection:', error);
        return NextResponse.json(
            { error: 'Failed to remove from collection' },
            { status: 500 }
        );
    }
}
