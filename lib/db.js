
import connectToDatabase from './mongodb.js';
import Card from '../models/Card.js';
import { getCategoryFromCard, POKEMON_NAMES } from './pokedex.js';
import Collection from '../models/Collection.js';

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
export async function findCards(query) {
    await db();

    let regex;
    if (query instanceof RegExp) {
        regex = query;
    } else {
        regex = new RegExp(query, 'i');
    }

    // Search multiple fields
    const cards = await Card.find({
        $or: [
            { name: { $regex: regex } },
            { nameJP: { $regex: regex } },
            { nameCN: { $regex: regex } },
            { nameEN: { $regex: regex } },
            { set: { $regex: regex } },
            { setId: { $regex: regex } },
            { setCode: { $regex: regex } }
        ]
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

// 10. Get Browse Sets (New)
export async function getBrowseSets(sortBy = 'name', language = 'all') {
    await db();

    // Build match stage for language filter
    let matchStage = {};

    if (language === 'japanese') {
        matchStage = { set: /Japanese/i };
    } else if (language === 'chinese') {
        matchStage = { set: /Chinese/i };
    } else if (language === 'english') {
        matchStage = { set: { $not: /Japanese|Chinese/i } };
    }
    // 'all' = no filter

    // Group logic to extract set metadata
    const groupStage = {
        $group: {
            _id: { $ifNull: ["$setId", "$set"] },
            name: { $first: "$set" },
            count: { $sum: 1 },
            image: { $first: "$image" },
            // Capture latest date for "Newest" sort
            // usage releaseDate if available, else createdAt/updatedAt
            latestDate: { $max: "$sourceUrl" } // Proxy for release? No, PriceCharting URL isn't date.
            // Actually, we don't have reliable releaseDate in DB yet.
            // But we can use 'createdAt' of the CARDS as a proxy for when we added them?
            // Or try to parse year from name?
        }
    };

    // Determine Sort Stage
    let sortStage = { $sort: { _id: 1 } }; // Default A-Z

    if (sortBy === 'count') {
        sortStage = { $sort: { count: -1 } };
    } else if (sortBy === 'date') {
        // Since we lack real releaseDate, sort by name descending as proxy for new sets?
        // Or actually, modern sets often start with "Scalet & Violet", "Sword & Shield".
        // Better proxy: _id (slug) descending often puts newer sets first if they are chronological? Not really.
        // Let's use count for now or name.
        // Wait, User asked for "Pack Release Date".
        // If we don't have it, we can try to sort by 'name' assuming YY-MM in name? No.

        // Alternative: Use 'updatedAt' max?
        // if we just scraped them, they are all new.

        // BEST EFFORT: Sort by name descending (Z-A) usually shows newer sets if named "XY...", "Sun & Moon..."
        // but "Scarlet" comes after "Sun".
        // Let's stick to Name A-Z / Z-A and Count for now, and add "Newest" if we can find a Proxy.
        // Let's use { _id: -1 } for now as "Z-A" proxy?
        sortStage = { $sort: { name: -1 } };
    }

    const pipeline = [
        { $sort: { image: -1 } } // Prioritize cards with images for the cover
    ];

    // Add match stage if filtering by language
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
    }

    pipeline.push(groupStage, sortStage);

    const sets = await Card.aggregate(pipeline);

    return sets.map(s => ({
        id: s._id,
        name: s.name || s._id,
        count: s.count,
        image: s.image
    }));
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
