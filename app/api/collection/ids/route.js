import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserCollectionIds } from '@/lib/db';

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ ids: [] });
    }

    try {
        const ids = await getUserCollectionIds(userId);
        return NextResponse.json({ ids });
    } catch (error) {
        console.error('Failed to fetch collection IDs:', error);
        return NextResponse.json({ ids: [] }, { status: 500 });
    }
}
