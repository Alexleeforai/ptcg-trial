import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

// Simple in-memory rate limiter (per-process, resets on deploy)
const rateLimiter = new Map(); // userId -> { count, resetAt }
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 60; // 60 messages per hour
const RATE_LIMIT_BURST = 1000; // minimum 1s between messages

function checkRateLimit(userId) {
    const now = Date.now();
    const entry = rateLimiter.get(userId);

    if (!entry || now > entry.resetAt) {
        rateLimiter.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW, lastSent: now });
        return true;
    }

    // Burst check: 1 message per second
    if (now - entry.lastSent < RATE_LIMIT_BURST) {
        return false;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }

    entry.count++;
    entry.lastSent = now;
    return true;
}

// Strip HTML tags to prevent XSS
function sanitize(text) {
    return text.replace(/<[^>]*>/g, '').trim();
}

export async function GET(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();

        // Security: Verify caller is a participant of this conversation
        const conversation = await Conversation.findOne({
            _id: id,
            participants: { $in: [userId] }
        });

        if (!conversation) {
            return new NextResponse('Conversation not found', { status: 404 });
        }

        // Support polling: ?after=ISO_timestamp
        const url = new URL(req.url);
        const after = url.searchParams.get('after');

        const query = { conversationId: id };
        if (after) {
            query.createdAt = { $gt: new Date(after) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: 1 })
            .limit(100) // Safety cap
            .lean();

        return NextResponse.json(messages);

    } catch (error) {
        console.error('[CHAT_MESSAGES_GET]', error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Rate limit check
        if (!checkRateLimit(userId)) {
            return new NextResponse('Rate limit exceeded. Please slow down.', { status: 429 });
        }

        const { id } = await params;
        const body = await req.json();

        let content = body.content;

        // Validate content
        if (!content || typeof content !== 'string') {
            return new NextResponse('Message content is required', { status: 400 });
        }

        // Sanitize: strip HTML, trim
        content = sanitize(content);

        if (content.length === 0) {
            return new NextResponse('Message cannot be empty', { status: 400 });
        }

        if (content.length > 1000) {
            return new NextResponse('Message too long (max 1000 characters)', { status: 400 });
        }

        await connectToDatabase();

        // Security: Verify caller is a participant
        const conversation = await Conversation.findOne({
            _id: id,
            participants: { $in: [userId] }
        });

        if (!conversation) {
            return new NextResponse('Conversation not found', { status: 404 });
        }

        // Create message with server-enforced senderId
        const message = await Message.create({
            conversationId: id,
            senderId: userId, // Always from auth(), never from client
            content
        });

        // Update conversation metadata
        const otherUserId = conversation.participants.find(p => p !== userId);
        const currentUnread = conversation.unreadCount?.get?.(otherUserId) || conversation.unreadCount?.[otherUserId] || 0;

        await Conversation.findByIdAndUpdate(id, {
            $set: {
                lastMessage: content.substring(0, 100), // Preview (truncated)
                lastMessageAt: new Date(),
                [`unreadCount.${otherUserId}`]: currentUnread + 1
            }
        });

        return NextResponse.json(message);

    } catch (error) {
        console.error('[CHAT_MESSAGES_POST]', error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}
