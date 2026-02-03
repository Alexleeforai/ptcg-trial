
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
    },
    purchasePrice: {
        type: Number,
        default: 0
    },
    items: {
        type: [{
            id: String,
            price: Number,
            grade: { type: String, default: 'RAW' }, // RAW, PSA10, GRADE9
            note: String
        }],
        default: []
    }
}, {
    timestamps: true
});

// Compound index to ensure a user can't bookmark the same card twice
CollectionSchema.index({ userId: 1, cardId: 1 }, { unique: true });

// Fix for hot reload: delete model if it exists to ensure new schema (items) is picked up
if (process.env.NODE_ENV === 'development') {
    if (mongoose.models.Collection) {
        delete mongoose.models.Collection;
    }
}

export default mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
