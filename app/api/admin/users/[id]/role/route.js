import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function PUT(req, { params }) {
    try {
        const { userId: callerId } = await auth();
        if (!callerId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const client = await clerkClient();
        const caller = await client.users.getUser(callerId);

        if (caller.publicMetadata?.role !== 'admin') {
            return new NextResponse('Forbidden: Admins only', { status: 403 });
        }

        const resolvedParams = await params;
        const targetUserId = resolvedParams.id;

        // Prevent users from changing their own role (optional, but good practice to prevent accidental self-lockout)
        if (targetUserId === callerId) {
            return new NextResponse('You cannot change your own admin status here.', { status: 400 });
        }

        const body = await req.json();
        const { action } = body; // 'grant' or 'revoke'

        let newRole = null;
        if (action === 'grant') {
            newRole = 'admin';
        } else if (action === 'revoke') {
            newRole = null;
        } else {
            return new NextResponse('Invalid action. Use grant or revoke.', { status: 400 });
        }

        // Update the user's metadata in Clerk
        const updatedUser = await client.users.updateUserMetadata(targetUserId, {
            publicMetadata: {
                role: newRole
            }
        });

        return NextResponse.json({
            id: updatedUser.id,
            role: updatedUser.publicMetadata?.role || 'user'
        });

    } catch (error) {
        console.error('[ADMIN_USERS_ROLE_PUT]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
