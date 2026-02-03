
import mongoose from 'mongoose';

const CardSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // snkr-12345 or pc-pokemon-base-set-charizard-4
    name: { type: String, required: true },
    nameJP: String,
    nameCN: String,
    nameEN: String,
    image: String,
    price: Number, // Latest market price (SNKRDUNK JPY)
    currency: { type: String, default: 'JPY' }, // JPY, USD, EUR, etc.

    // PriceCharting specific fields
    priceRaw: Number, // Raw/ungraded price (USD for PriceCharting)
    priceGrade9: Number, // Grade 9 price (USD)
    priceGrade95: Number, // Grade 9.5 price (USD)
    pricePSA10: Number, // PSA 10 price (USD)

    set: String,
    setId: String, // e.g., "pokemon-base-set"
    setCode: String, // Official set code (e.g., m1L, CLB, s8a) - manually populated
    number: String, // Card number, e.g., "#4"
    cardType: String, // 'single', 'box'
    releaseDate: String,
    link: String,
    sourceUrl: String, // Source URL (PriceCharting, SNKRDUNK, etc.)
    tcgPlayerId: String, // Optional: TCGPlayer/Pokemon TCG API ID

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
    timestamps: true, // adds createdAt, updatedAt automatically (but we might override updatedAt from scrape)
    strict: false // Allow fields not in schema (for PriceCharting fields compatibility)
});

// Prevent model overwrite in dev hot reload
export default mongoose.models.Card || mongoose.model('Card', CardSchema);
