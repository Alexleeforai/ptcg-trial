import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// POST /api/admin/upload-image
// multipart/form-data with field "file"
export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file');
        if (!file) return new NextResponse('No file', { status: 400 });

        // Generate a clean filename
        const ext = file.name.split('.').pop();
        const filename = `set-covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const blob = await put(filename, file, {
            access: 'public',
            contentType: file.type,
        });

        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error('[UPLOAD_IMAGE]', error);
        return new NextResponse(error.message || 'Upload failed', { status: 500 });
    }
}
