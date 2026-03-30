
import connectToDatabase from './mongodb.js';
import Card from '../models/Card.js';
import { getCategoryFromCard, POKEMON_NAMES } from './pokedex.js';
import Collection from '../models/Collection.js';
import MerchantProfile from '../models/MerchantProfile.js';
import Listing from '../models/Listing.js';
import SetMetadata from '../models/SetMetadata.js';

// Helper to ensure connection
async function db() {
    await connectToDatabase();
}

// Helper to convert MongoDB docs to plain objects
function toPlainObject(doc) {
    return JSON.parse(JSON.stringify(doc));
}

export async function getAllCards() {
    await db();
    const cards = await Card.find({}).lean();
    return toPlainObject(cards);
}

// Paginated fetch
export async function getCardsPaginated(page = 1, limit = 24) {
    await db();
    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
        Card.find({})
            .sort({ views: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Card.countDocuments({})
    ]);

    return {
        cards: toPlainObject(cards),
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalCards: total
    };
}

export async function getCardById(id) {
    await db();
    // Try exact match first
    let card = await Card.findOne({ id }).lean();

    // If not found, try alternative encoding (e.g. %27 vs ')
    if (!card) {
        // If id has %27, try decoding it
        if (id.includes('%')) {
            const decoded = decodeURIComponent(id);
            if (decoded !== id) {
                card = await Card.findOne({ id: decoded }).lean();
            }
        }
        // If id has ', try encoding it (though less likely for our db format)
        else if (id.includes("'")) {
            // Our DB seems to store encoded IDs like %27 sometimes?
            // Let's check the reverse:
            const encoded = id.replace(/'/g, "%27");
            card = await Card.findOne({ id: encoded }).lean();
        }
    }

    return card ? toPlainObject(card) : null;
}

// Enhanced search: supports String or RegExp
export async function findCards(query, type = 'all') {
    await db();

    let regex;
    if (query instanceof RegExp) {
        regex = query;
    } else {
        regex = new RegExp(query, 'i');
    }

    // Special handling for Card Numbers
    // PriceCharting stores numbers in the name field as "#110" or similar.
    // So if the user types "110/080" or "006/101", we should extract the first part
    // and also search for it with a '#' prefix.
    let numberQuery = typeof query === 'string' ? query : '';
    let numberRegex = null;
    if (typeof query === 'string' && /^\d{1,3}(\/\d{2,3})?$/.test(query.trim())) {
        const baseNumber = query.trim().split('/')[0];
        // Strip leading zeros for the regex since PriceCharting sometimes drops them
        const strippedNumber = parseInt(baseNumber, 10).toString();
        numberRegex = new RegExp(`(#${baseNumber}|#${strippedNumber})\\b`, 'i');
    }

    let searchConditions;

    if (type === 'setCode') {
        // Strict exact match (case-insensitive) for Set Code
        const strictRegex = new RegExp(`^${query}$`, 'i');
        searchConditions = [
            { set: { $regex: strictRegex } },
            { setId: { $regex: strictRegex } },
            { setCode: { $regex: strictRegex } }
        ];
    } else if (type === 'name') {
        searchConditions = [
            { name: { $regex: regex } },
            { nameJP: { $regex: regex } },
            { nameCN: { $regex: regex } },
            { nameEN: { $regex: regex } }
        ];
    } else {
        // 'all'
        searchConditions = [
            { name: { $regex: regex } },
            { nameJP: { $regex: regex } },
            { nameCN: { $regex: regex } },
            { nameEN: { $regex: regex } },
            { set: { $regex: regex } },
            { setId: { $regex: regex } },
            { setCode: { $regex: regex } },
            { number: { $regex: regex } }
        ];

        if (numberRegex) {
            searchConditions.push({ name: { $regex: numberRegex } });
            searchConditions.push({ nameJP: { $regex: numberRegex } });
        }
    }

    // Search fields based on type
    const cards = await Card.find({
        $or: searchConditions
    }).lean();
    return toPlainObject(cards);
}

export async function upsertCards(newCards) {
    await db();

    if (!newCards || newCards.length === 0) return;

    const ops = newCards.map(card => ({
        updateOne: {
            filter: { id: card.id },
            update: {
                $set: card,
                $setOnInsert: { createdAt: new Date() }
            },
            upsert: true
        }
    }));

    await Card.bulkWrite(ops);
}

// 4. Get Cards by Set
export async function getCardsBySet(setName) {
    await db();
    // Support Name OR ID
    const cards = await Card.find({
        $or: [{ set: setName }, { setId: setName }]
    }).lean();
    return toPlainObject(cards);
}

// 5. Get Latest Boxes
export async function getLatestBoxes(limit = 4) {
    await db();
    const boxes = await Card.find({ cardType: 'box' })
        .sort({ releaseDate: -1, createdAt: -1 })
        .limit(limit)
        .lean();
    return toPlainObject(boxes);
}

// 6. Increment Card View
export async function incrementCardView(id) {
    await db();
    await Card.updateOne(
        { id },
        {
            $inc: { views: 1 },
            $set: { lastViewedAt: new Date() }
        }
    );
}

// 7. Get Trending Cards (Most views)
export async function getTrendingCards(limit = 4) {
    await db();
    const cards = await Card.find({})
        .sort({ views: -1 })
        .limit(limit)
        .lean();
    return toPlainObject(cards);
}

// 8. Get Top Risers (Price Increase)
export async function getTopRisers(limit = 4) {
    await db();
    const cards = await Card.find({
        priceHistory: { $exists: true, $not: { $size: 0 } },
        price: { $gt: 0 }
    }).lean();

    const risers = cards.map(card => {
        if (!card.priceHistory || card.priceHistory.length < 1) return null;
        const history = card.priceHistory;
        const oldPrice = history[0].price;
        const currentPrice = card.price;

        if (!oldPrice || oldPrice === 0) return null;

        const diff = currentPrice - oldPrice;
        const percent = (diff / oldPrice) * 100;

        if (percent <= 0) return null;

        return {
            ...card,
            risePercent: parseFloat(percent.toFixed(1)),
            riseAmount: diff
        };
    }).filter(c => c !== null);

    risers.sort((a, b) => b.risePercent - a.risePercent);

    return toPlainObject(risers.slice(0, limit));
}

// 9. Get Browse Categories (Still used? Maybe for legacy compatibility)
export async function getBrowseCategories() {
    await db();
    const cards = await Card.find({
        $or: [{ cardType: 'single' }, { cardType: { $exists: false } }]
    }).select('name image').lean();

    const categories = {
        trainers: { name: 'Trainers', count: 0, image: '' },
        items: { name: 'Items', count: 0, image: '' },
        pokemon: {}
    };

    cards.forEach(card => {
        const catData = getCategoryFromCard(card);
        let catName = typeof catData === 'string' ? catData : catData.name;

        if (catName === 'Trainers') {
            categories.trainers.count++;
            if (!categories.trainers.image && card.image) categories.trainers.image = card.image;
        } else if (catName === 'Items') {
            categories.items.count++;
            if (!categories.items.image && card.image) categories.items.image = card.image;
        } else {
            if (!categories.pokemon[catName]) {
                categories.pokemon[catName] = {
                    name: catName,
                    count: 0,
                    image: ''
                };
            }
            categories.pokemon[catName].count++;
            if (!categories.pokemon[catName].image && card.image) {
                categories.pokemon[catName].image = card.image;
            }
        }
    });

    const sortedPokemon = Object.values(categories.pokemon).sort((a, b) => a.name.localeCompare(b.name));

    return {
        trainers: categories.trainers,
        items: categories.items,
        pokemon: sortedPokemon
    };
}

export async function getBrowseSets(sortBy = 'name', language = 'all') {
    await db();

    // 1. Fetch all SetMetadata docs for overlay
    let metaDocs = [];
    try { metaDocs = await SetMetadata.find({}).lean(); } catch (e) { /* model might not exist yet */ }
    const metaMap = new Map(metaDocs.map(m => [m.setId, m]));

    // Helper: resolve language for a set
    function resolveLanguage(setId, name) {
        const meta = metaMap.get(setId);
        if (meta && meta.language) return meta.language;
        if (/japanese/i.test(name)) return 'japanese';
        if (/chinese|traditional|simplified/i.test(name)) return 'chinese';
        return 'english';
    }

    // 2. Aggregate cards by set (no language filter here — we filter after resolving via metadata)
    const pipeline = [
        { $sort: { image: -1 } }, // cards with images first so $first captures one
        {
            $group: {
                _id: { $ifNull: ['$setId', '$set'] },
                name: { $first: '$set' },
                count: { $sum: 1 },
                image: { $first: '$image' },
            }
        }
    ];

    const sets = await Card.aggregate(pipeline);

    // 3. Merge metadata + apply language filter
    let result = sets.map(s => {
        const meta = metaMap.get(s._id) || {};
        const lang = resolveLanguage(s._id, s.name || '');
        return {
            id: s._id,
            name: meta.name || s.name || s._id,
            count: s.count,
            image: meta.coverImage || s.image,   // custom cover takes priority
            releaseDate: meta.releaseDate || null,
            language: lang,
        };
    });

    // 4. Language filter
    if (language !== 'all') {
        result = result.filter(s => s.language === language);
    }

    // 5. Sort
    if (sortBy === 'count') {
        result.sort((a, b) => b.count - a.count);
    } else if (sortBy === 'date') {
        result.sort((a, b) => {
            if (!a.releaseDate && !b.releaseDate) return a.name.localeCompare(b.name);
            if (!a.releaseDate) return 1;
            if (!b.releaseDate) return -1;
            return new Date(b.releaseDate) - new Date(a.releaseDate);
        });
    } else {
        // name A-Z
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
}

// 11. Get All Sets with Codes (Admin UI)
export async function getAllSetsWithCodes() {
    await db();

    const sets = await Card.aggregate([
        {
            $group: {
                _id: { $ifNull: ["$setId", "$set"] },
                name: { $first: "$set" },
                setCode: { $first: "$setCode" },
                count: { $sum: 1 }
            }
        },
        { $sort: { name: 1 } }
    ]);

    return sets.map(s => ({
        id: s._id,
        name: s.name || s._id,
        setCode: s.setCode || '',
        count: s.count
    }));
}

// 12. Update Set Code (Admin UI)
export async function updateSetCode(setId, setCode) {
    await db();

    // Update all cards in this set
    const result = await Card.updateMany(
        { $or: [{ setId }, { set: setId }] },
        { $set: { setCode: setCode || null } }
    );

    return result.modifiedCount;
}

export async function getListingsForCard(cardId) {
    await db();

    // Find active listings
    const listings = await Listing.find({ cardId, stock: { $gt: 0 } }).lean();
    if (!listings || listings.length === 0) return [];

    // Collect merchant IDs
    const merchantIds = [...new Set(listings.map(l => l.merchantId))];

    // Fetch merchant profiles
    const merchants = await MerchantProfile.find({
        userId: { $in: merchantIds },
        isActive: true
    }).lean();

    const merchantMap = new Map(merchants.map(m => [m.userId, m]));

    // Map and enrich
    const result = [];
    for (const listing of listings) {
        const merchant = merchantMap.get(listing.merchantId);
        if (!merchant) continue;

        result.push({
            id: listing._id ? listing._id.toString() : Math.random().toString(),
            merchantId: merchant.userId,
            type: 'sell', // Currently all are sells
            price: listing.price,
            stock: listing.stock,
            condition: listing.condition,
            updatedAt: listing.updatedAt,
            shop: {
                id: merchant.userId,
                name: merchant.shopName,
                location: merchant.address || 'Online',
                icon: merchant.shopIcon || merchant.logoUrl || null
            }
        });
    }

    // Sort ascending by price
    return result.sort((a, b) => a.price - b.price);
}

export function readDB() { return []; }
export function writeDB() { return false; }

// ============================================
// Collection Functions (Exported but skipped detailed body as unlikely to change)
// ============================================

export async function addToCollection(userId, cardId) {
    await db();
    try {
        const collection = new Collection({ userId, cardId });
        await collection.save();
        return { success: true };
    } catch (error) {
        if (error.code === 11000) {
            return { success: true, message: 'Already in collection' };
        }
        throw error;
    }
}

export async function removeFromCollection(userId, cardId) {
    await db();
    const result = await Collection.deleteOne({ userId, cardId });
    return { success: result.deletedCount > 0 };
}

export async function getUserCollection(userId) {
    await db();
    const result = await Collection.aggregate([
        { $match: { userId } },
        { $sort: { addedAt: -1 } },
        {
            $lookup: {
                from: 'cards',
                localField: 'cardId',
                foreignField: 'id',
                as: 'cardDetails'
            }
        },
        { $unwind: { path: '$cardDetails', preserveNullAndEmptyArrays: false } },
        {
            $project: {
                _id: 0,
                addedAt: 1,
                purchasePrice: 1, // Legacy support
                items: 1, // New structure
                id: '$cardDetails.id',
                name: '$cardDetails.name',
                nameJP: '$cardDetails.nameJP',
                nameCN: '$cardDetails.nameCN',
                nameEN: '$cardDetails.nameEN',
                image: '$cardDetails.image',
                price: '$cardDetails.price',
                priceRaw: '$cardDetails.priceRaw', // Add priceRaw
                pricePSA10: '$cardDetails.pricePSA10', // Add pricePSA10
                currency: '$cardDetails.currency', // Add currency
                set: '$cardDetails.set',
                cardType: '$cardDetails.cardType',
                releaseDate: '$cardDetails.releaseDate',
                link: '$cardDetails.link',
                priceHistory: '$cardDetails.priceHistory'
            }
        }
    ]);
    return toPlainObject(result);
}

export async function isInCollection(userId, cardId) {
    await db();
    const exists = await Collection.exists({ userId, cardId });
    return !!exists;
}

export async function getCollectionItem(userId, cardId) {
    await db();
    const item = await Collection.findOne({ userId, cardId }).lean();
    return item ? toPlainObject(item) : null;
}

export async function getUserCollectionIds(userId) {
    await db();
    const result = await Collection.find({ userId }).select('cardId').lean();
    return result.map(item => item.cardId);
}

export async function updateCollectionItem(userId, cardId, data) {
    await db();
    const result = await Collection.updateOne(
        { userId, cardId },
        { $set: data }
    );
    return result.matchedCount > 0;
}


// ============================================
// Set Code Management
// ============================================

// updateSetCode is already defined above, removing duplicate.
