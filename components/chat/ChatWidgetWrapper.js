'use client';

import { useUser } from '@clerk/nextjs';
import ChatWidget from '@/components/chat/ChatWidget';

export default function ChatWidgetWrapper() {
    const { isSignedIn } = useUser();

    // Only show chat widget for signed-in users
    if (!isSignedIn) return null;

    return <ChatWidget />;
}
