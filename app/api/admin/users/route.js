import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const client = await clerkClient();
        const caller = await client.users.getUser(userId);

        if (caller.publicMetadata?.role !== 'admin') {
            return new NextResponse('Forbidden: Admins only', { status: 403 });
        }

        // Fetch users from Clerk
        // Note: For a very large app, you'd want pagination. Limit to 100 for now.
        const usersResponse = await client.users.getUserList({
            limit: 100,
            orderBy: '-created_at'
        });

        // Map clerk users to a simplified format for the frontend
        const formattedUsers = usersResponse.data.map(user => {
            const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
                || user.emailAddresses[0]?.emailAddress
                || 'No email';

            return {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
                email: primaryEmail,
                role: user.publicMetadata?.role || 'user',
                createdAt: user.createdAt
            };
        });

        return NextResponse.json(formattedUsers);
    } catch (error) {
        console.error('[ADMIN_USERS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
