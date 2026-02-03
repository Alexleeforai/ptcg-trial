import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAllSetsWithCodes, updateSetCode } from '@/lib/db';

// GET - Fetch all sets with codes
export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const sets = await getAllSetsWithCodes();
        return NextResponse.json({ sets });
    } catch (error) {
        console.error('[Admin Sets GET]', error);
        return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 });
    }
}

// POST - Update set code
export async function POST(request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { setId, setCode } = await request.json();

        if (!setId) {
            return NextResponse.json({ error: 'setId is required' }, { status: 400 });
        }

        const modifiedCount = await updateSetCode(setId, setCode);

        return NextResponse.json({
            success: true,
            modifiedCount,
            message: `Updated ${modifiedCount} cards`
        });
    } catch (error) {
        console.error('[Admin Sets POST]', error);
        return NextResponse.json({ error: 'Failed to update set code' }, { status: 500 });
    }
}
