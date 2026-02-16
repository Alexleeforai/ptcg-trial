import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
    participants: {
        type: [String],     // [userId, merchantUserId] — exactly 2
        required: true,
        validate: {
            validator: function (v) {
                return v.length === 2 && v[0] !== v[1]; // Exactly 2 different users
            },
            message: 'Conversation must have exactly 2 different participants'
        },
        index: true
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    // Per-participant unread count: { "user_abc": 0, "user_xyz": 2 }
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },
    // Per-participant display names: { "user_abc": "Alex", "user_xyz": "Card Shop HK" }
    displayNames: {
        type: Map,
        of: String,
        default: {}
    }
}, { timestamps: true });

// Compound index: fast lookup for "find conversations where I'm a participant"
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Ensure only one conversation between the same two participants
ConversationSchema.index(
    { participants: 1 },
    {
        unique: true,
        // Sort participants before indexing to ensure [A,B] and [B,A] are the same
        // We'll enforce sorting in the API layer
    }
);

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
