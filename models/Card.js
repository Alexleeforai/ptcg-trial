
import mongoose from 'mongoose';

const CardSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // snkr-12345
    name: { type: String, required: true },
    nameJP: String,
    nameCN: String,
    nameEN: String,
    image: String,
    price: Number, // Latest market price (JPY)
    set: String,
    cardType: String, // 'single', 'box'
    releaseDate: String,
    link: String,

    // Statistics
    views: { type: Number, default: 0 },
    lastViewedAt: Date,

    // Stats
    updatedAt: Date,
    createdAt: Date,

    // History
    priceHistory: [{
        date: String, // YYYY-MM-DD
        price: Number
    }],

    // Merchant Listings (New Feature)
    merchantListings: [{
        merchantId: String, // Clerk User ID
        merchantName: String,
        price: Number, // HKD? Or JPY? Usually merchant sets local price (HKD)
        stock: Number,
        condition: String, // 'S', 'A', 'B'
        updatedAt: Date
    }]
}, {
    timestamps: true // adds createdAt, updatedAt automatically (but we might override updatedAt from scrape)
});

// Prevent model overwrite in dev hot reload
export default mongoose.models.Card || mongoose.model('Card', CardSchema);
