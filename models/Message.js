import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    senderId: {
        type: String,       // Clerk userId — always set server-side
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000     // Prevent oversized messages
    },
    readAt: {
        type: Date,
        default: null       // null = unread
    }
}, { timestamps: true });

// Fast query: "get messages for conversation X after timestamp Y"
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
