import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ role: null });

        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const role = user.publicMetadata?.role || null;

        return NextResponse.json({ role });
    } catch (error) {
        console.error('[ME_ROLE]', error);
        return NextResponse.json({ role: null });
    }
}
