import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export async function PUT(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();

        // Security: Verify caller is a participant
        const conversation = await Conversation.findOne({
            _id: id,
            participants: { $in: [userId] }
        });

        if (!conversation) {
            return new NextResponse('Conversation not found', { status: 404 });
        }

        // Mark all unread messages (sent by others) as read
        await Message.updateMany(
            {
                conversationId: id,
                senderId: { $ne: userId }, // Only mark OTHER person's messages
                readAt: null
            },
            { $set: { readAt: new Date() } }
        );

        // Reset my unread count
        await Conversation.findByIdAndUpdate(id, {
            $set: { [`unreadCount.${userId}`]: 0 }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[CHAT_READ_PUT]', error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}
