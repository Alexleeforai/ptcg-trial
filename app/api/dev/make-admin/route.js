import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET(req) {
    // Only allow this in local development
    if (process.env.NODE_ENV !== 'development') {
        return new NextResponse('Only allowed in development', { status: 403 });
    }

    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Please login to the site first.', { status: 401 });
        }

        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'admin'
            }
        });

        const html = `
            <div style="font-family: sans-serif; padding: 40px; text-align: center;">
                <h1 style="color: #4ade80;">Success! ✅</h1>
                <p>Your account is now an <strong>admin</strong>.</p>
                <p>Please refresh your browser or log out and log back in if the changes don't apply immediately.</p>
                <a href="/merchant" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px;">Go to Dashboard</a>
                <a href="/admin/verifications" style="display: inline-block; padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; margin-left: 10px;">Go to Admin Panel</a>
            </div>
        `;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
    } catch (error) {
        console.error('[DEV_MAKE_ADMIN]', error);
        return new NextResponse(error.message, { status: 500 });
    }
}
