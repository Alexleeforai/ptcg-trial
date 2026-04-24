import mongoose from 'mongoose';

const SnkrdunkIndexSchema = new mongoose.Schema(
    {
        productId: { type: Number, required: true, unique: true, index: true },
        setCode: { type: String, index: true },
        setCodeLower: { type: String, index: true },
        cardNum: { type: Number, index: true },
        denom: Number,
        name: String,
        url: String,
        sourceSitemap: String,
        lastSeenAt: { type: Date, default: Date.now, index: true },
    },
    {
        timestamps: true,
        strict: false,
    }
);

SnkrdunkIndexSchema.index({ setCodeLower: 1, cardNum: 1 });

export default mongoose.models.SnkrdunkIndex || mongoose.model('SnkrdunkIndex', SnkrdunkIndexSchema);

