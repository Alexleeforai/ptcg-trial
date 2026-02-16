'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ChatWidget.module.css';

const POLL_INTERVAL = 3000; // 3 seconds

export default function ChatWidget({ initialMerchantId = null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null); // full conversation object
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    const [namePrompt, setNamePrompt] = useState(null); // { merchantId, shopName } when prompting
    const [userName, setUserName] = useState('');

    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);
    const lastTimestampRef = useRef(null);

    // ─────────── Fetch conversations ───────────
    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/chat/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
                const total = data.reduce((sum, c) => sum + (c.myUnreadCount || 0), 0);
                setTotalUnread(total);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    }, []);

    // ─────────── Fetch messages (for active conversation) ───────────
    const fetchMessages = useCallback(async (convId, isPolling = false) => {
        try {
            let url = `/api/chat/conversations/${convId}/messages`;
            if (isPolling && lastTimestampRef.current) {
                url += `?after=${encodeURIComponent(lastTimestampRef.current)}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();

                if (isPolling && data.length > 0) {
                    // Deduplicate: only append messages not already in state
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m._id));
                        const newOnly = data.filter(m => !existingIds.has(m._id));
                        return newOnly.length > 0 ? [...prev, ...newOnly] : prev;
                    });
                } else if (!isPolling) {
                    setMessages(data);
                }

                // Update last timestamp
                if (data.length > 0) {
                    lastTimestampRef.current = data[data.length - 1].createdAt;
                }
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    }, []);

    // ─────────── Mark as read ───────────
    const markAsRead = useCallback(async (convId) => {
        try {
            await fetch(`/api/chat/conversations/${convId}/read`, { method: 'PUT' });
            // Refresh conversation list to update unread counts
            fetchConversations();
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    }, [fetchConversations]);

    // ─────────── Open widget + auto-start conversation ───────────
    useEffect(() => {
        if (initialMerchantId) {
            handleStartChat(initialMerchantId);
        }
    }, [initialMerchantId]);

    // ─────────── Fetch conversations on open ───────────
    useEffect(() => {
        if (isOpen) {
            fetchConversations();
        }
    }, [isOpen, fetchConversations]);

    // ─────────── Polling for active conversation ───────────
    useEffect(() => {
        if (activeConv) {
            // Initial full fetch
            lastTimestampRef.current = null;
            fetchMessages(activeConv._id, false);
            markAsRead(activeConv._id);

            // Start polling
            pollRef.current = setInterval(() => {
                fetchMessages(activeConv._id, true);
            }, POLL_INTERVAL);
        }

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [activeConv, fetchMessages, markAsRead]);

    // ─────────── Auto-scroll ───────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─────────── Start a new chat (show name prompt first) ───────────
    const handleStartChat = async (merchantId, shopName) => {
        // Check if we already have a saved name
        const savedName = typeof window !== 'undefined' ? localStorage.getItem('chatDisplayName') : null;
        if (savedName) {
            // Skip prompt, use saved name
            await createConversation(merchantId, savedName);
        } else {
            // Show name prompt
            setNamePrompt({ merchantId, shopName: shopName || 'this shop' });
            setUserName('');
            setIsOpen(true);
        }
    };

    const createConversation = async (merchantId, displayName) => {
        try {
            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ merchantId, displayName })
            });

            if (res.ok) {
                const conv = await res.json();
                setActiveConv(conv);
                setNamePrompt(null);
                setIsOpen(true);
                // Save name for future chats
                if (displayName && typeof window !== 'undefined') {
                    localStorage.setItem('chatDisplayName', displayName);
                }
            } else {
                const errText = await res.text();
                console.error('Failed to start chat:', errText);
            }
        } catch (err) {
            console.error('Error starting chat:', err);
        }
    };

    const handleNameSubmit = () => {
        const name = userName.trim();
        if (!name || !namePrompt) return;
        createConversation(namePrompt.merchantId, name);
    };

    // ─────────── Send message ───────────
    const handleSend = async () => {
        if (!inputText.trim() || !activeConv || sending) return;

        const content = inputText.trim();
        setSending(true);

        try {
            const res = await fetch(`/api/chat/conversations/${activeConv._id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                setInputText('');
                // Full refetch to avoid duplicates — no optimistic append
                lastTimestampRef.current = null;
                await fetchMessages(activeConv._id, false);
                // Update conversation list
                fetchConversations();
            } else {
                const errText = await res.text();
                alert(errText);
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ─────────── Time formatting ───────────
    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;

        if (diff < 60 * 1000) return 'just now';
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 24 * 60 * 60 * 1000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // ─────────── Expose startChat for external use ───────────
    if (typeof window !== 'undefined') {
        window.__chatWidget = { startChat: handleStartChat };
    }

    // ─────────── Render ───────────
    return (
        <>
            {/* Floating toggle button */}
            <button className={styles.chatToggle} onClick={() => setIsOpen(!isOpen)} id="chat-toggle">
                💬
                {totalUnread > 0 && (
                    <span className={styles.unreadBadge}>{totalUnread > 99 ? '99+' : totalUnread}</span>
                )}
            </button>

            {/* Chat panel */}
            {isOpen && (
                <div className={styles.chatPanel}>
                    {/* Header */}
                    <div className={styles.panelHeader}>
                        <div className={styles.panelTitle}>
                            {(activeConv || namePrompt) && (
                                <button className={styles.backBtn} onClick={() => { setActiveConv(null); setNamePrompt(null); fetchConversations(); }}>
                                    ←
                                </button>
                            )}
                            {namePrompt
                                ? 'Enter Your Name'
                                : activeConv
                                    ? (activeConv.otherParticipant?.shopName || 'Chat')
                                    : 'Messages'
                            }
                        </div>
                        <button className={styles.closeBtn} onClick={() => { setIsOpen(false); setNamePrompt(null); }}>✕</button>
                    </div>

                    {namePrompt ? (
                        /* ─────────── Name Prompt ─────────── */
                        <div className={styles.namePrompt}>
                            <div className={styles.namePromptIcon}>👋</div>
                            <p className={styles.namePromptText}>
                                Before chatting with <strong>{namePrompt.shopName}</strong>, please enter your name:
                            </p>
                            <input
                                className={styles.namePromptInput}
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); }}
                                placeholder="Your name..."
                                maxLength={50}
                                autoFocus
                            />
                            <button
                                className={styles.namePromptBtn}
                                onClick={handleNameSubmit}
                                disabled={!userName.trim()}
                            >
                                Start Chat →
                            </button>
                        </div>
                    ) : activeConv ? (
                        /* ─────────── Active Chat View ─────────── */
                        <>
                            <div className={styles.messagesArea}>
                                {messages.map((msg) => {
                                    const isMe = msg.senderId !== activeConv.otherParticipant?.userId;
                                    return (
                                        <div key={msg._id}>
                                            <div className={`${styles.messageBubble} ${isMe ? styles.messageMe : styles.messageOther}`}>
                                                {msg.content}
                                            </div>
                                            <div className={`${styles.messageTime} ${!isMe ? styles.messageTimeOther : ''}`}>
                                                {formatTime(msg.createdAt)}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className={styles.inputArea}>
                                <input
                                    className={styles.inputField}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    maxLength={1000}
                                />
                                <span className={`${styles.charCount} ${inputText.length > 900 ? styles.charCountWarn : ''}`}>
                                    {inputText.length > 0 ? `${inputText.length}` : ''}
                                </span>
                                <button
                                    className={styles.sendBtn}
                                    onClick={handleSend}
                                    disabled={!inputText.trim() || sending}
                                >
                                    ↑
                                </button>
                            </div>
                        </>
                    ) : (
                        /* ─────────── Conversation List ─────────── */
                        <div className={styles.convList}>
                            {conversations.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <span>💬</span>
                                    <p>No conversations yet</p>
                                    <p style={{ fontSize: '0.75rem' }}>Visit a shop and click "Chat" to start!</p>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <div
                                        key={conv._id}
                                        className={styles.convItem}
                                        onClick={() => setActiveConv(conv)}
                                    >
                                        <div className={styles.convIcon}>
                                            {conv.otherParticipant?.shopIcon ? (
                                                <img src={conv.otherParticipant.shopIcon} alt="" />
                                            ) : (
                                                '🏪'
                                            )}
                                        </div>
                                        <div className={styles.convInfo}>
                                            <div className={styles.convName}>
                                                {conv.otherParticipant?.shopName || 'Unknown'}
                                            </div>
                                            <div className={styles.convPreview}>
                                                {conv.lastMessage || 'No messages yet'}
                                            </div>
                                        </div>
                                        <div className={styles.convMeta}>
                                            {conv.lastMessageAt && (
                                                <span className={styles.convTime}>{formatTime(conv.lastMessageAt)}</span>
                                            )}
                                            {conv.myUnreadCount > 0 && (
                                                <span className={styles.convUnread}>{conv.myUnreadCount}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
