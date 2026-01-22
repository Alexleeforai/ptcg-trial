
import mongoose from 'mongoose';

const CollectionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    cardId: {
        type: String,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure a user can't bookmark the same card twice
CollectionSchema.index({ userId: 1, cardId: 1 }, { unique: true });

// Prevent model overwrite in dev hot reload
export default mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
