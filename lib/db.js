
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
    const card = await Card.findOne({ id }).lean();
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
            { setId: { $regex: regex } }
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
export async function getBrowseSets() {
    await db();

    // Group by Set ID (more precise) or Set Name
    const sets = await Card.aggregate([
        { $sort: { image: -1 } }, // Prioritize cards with images
        {
            $group: {
                _id: { $ifNull: ["$setId", "$set"] }, // Use setId, fallback to set
                name: { $first: "$set" },
                count: { $sum: 1 },
                image: { $first: "$image" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    return sets.map(s => ({
        id: s._id,
        name: s.name || s._id,
        count: s.count,
        image: s.image
    }));
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
                id: '$cardDetails.id',
                name: '$cardDetails.name',
                nameJP: '$cardDetails.nameJP',
                nameCN: '$cardDetails.nameCN',
                nameEN: '$cardDetails.nameEN',
                image: '$cardDetails.image',
                price: '$cardDetails.price',
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
