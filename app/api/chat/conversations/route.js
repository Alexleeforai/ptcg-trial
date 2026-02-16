import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import MerchantProfile from '@/models/MerchantProfile';

export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await connectToDatabase();

        // Find all conversations where this user is a participant
        const conversations = await Conversation.find({
            participants: { $in: [userId] }
        })
            .sort({ lastMessageAt: -1 })
            .lean();

        // Enrich with participant info (shop name, icon)
        const enriched = await Promise.all(
            conversations.map(async (conv) => {
                const otherUserId = conv.participants.find(p => p !== userId);
                const profile = await MerchantProfile.findOne({ userId: otherUserId }).lean();

                return {
                    ...conv,
                    otherParticipant: {
                        userId: otherUserId,
                        shopName: profile?.shopName || 'Unknown',
                        shopIcon: profile?.shopIcon || null
                    },
                    myUnreadCount: conv.unreadCount?.get?.(userId) || conv.unreadCount?.[userId] || 0
                };
            })
        );

        return NextResponse.json(enriched);

    } catch (error) {
        console.error('[CHAT_CONVERSATIONS_GET]', error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { merchantId } = await req.json();

        if (!merchantId) {
            return new NextResponse('merchantId is required', { status: 400 });
        }

        // Security: Cannot chat with yourself
        if (merchantId === userId) {
            return new NextResponse('Cannot create conversation with yourself', { status: 400 });
        }

        await connectToDatabase();

        // Security: Validate that merchantId is a real, active merchant
        const merchantProfile = await MerchantProfile.findOne({
            userId: merchantId,
            isActive: true
        }).lean();

        if (!merchantProfile) {
            return new NextResponse('Merchant not found or inactive', { status: 404 });
        }

        // Sort participants to ensure consistent lookup (prevents duplicate conversations)
        const participants = [userId, merchantId].sort();

        // Find existing or create new conversation
        let conversation = await Conversation.findOne({ participants });

        if (!conversation) {
            conversation = await Conversation.create({
                participants,
                unreadCount: new Map([[userId, 0], [merchantId, 0]])
            });
        }

        return NextResponse.json({
            ...conversation.toObject(),
            otherParticipant: {
                userId: merchantId,
                shopName: merchantProfile.shopName,
                shopIcon: merchantProfile.shopIcon || null
            }
        });

    } catch (error) {
        console.error('[CHAT_CONVERSATIONS_POST]', error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}
