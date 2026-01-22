import { auth } from '@clerk/nextjs/server';
import { getUserCollection } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const collection = await getUserCollection(userId);

        return NextResponse.json({ cards: collection });
    } catch (error) {
        console.error('Error fetching collection:', error);
        return NextResponse.json(
            { error: 'Failed to fetch collection' },
            { status: 500 }
        );
    }
}
