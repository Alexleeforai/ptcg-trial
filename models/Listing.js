
import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema({
    merchantId: {
        type: String,
        required: true,
        index: true
    },
    cardId: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        default: null
    },
    stock: {
        type: Number,
        default: 0
    },
    condition: {
        type: String,
        default: 'Raw',
        enum: ['Raw', 'PSA 10', 'PSA 9']
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound index to ensure a merchant lists a card only once PER CONDITION
ListingSchema.index({ merchantId: 1, cardId: 1, condition: 1 }, { unique: true });

export default mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
