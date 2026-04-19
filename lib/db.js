
import connectToDatabase from './mongodb.js';
import Card from '../models/Card.js';
import { fetchSnkrdunkTradingCardQuote } from './snkrdunk.js';
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

    if (!card) return null;

    // 已對應 SNKRDUNK 但仍係「未拎過 SNK 價」狀態：
    // - 無 snkrdunkUpdatedAt（新配對）
    // - currency 仲係 USD（舊 PriceCharting 價）
    // - price === 0（上次拎價失敗或冇 listing，重試）
    const pid = Number(card.snkrdunkProductId);
    // For price=0 retry: only re-fetch if snkrdunkUpdatedAt is >1 hour old (avoid hammering on every load)
    const snkAge = card.snkrdunkUpdatedAt ? Date.now() - new Date(card.snkrdunkUpdatedAt).getTime() : Infinity;
    const priceIsZeroOrMissing = !card.price || Number(card.price) === 0;
    // Prices fetched before this date used the old logic (EN used-listings only, missed JP market).
    // Force re-fetch for anything older than this cutoff.
    // Prices fetched before this timestamp lacked USD source fields — force re-fetch to populate them.
    const PRICE_LOGIC_UPGRADED_AT = new Date('2026-04-14T09:25:00Z'); // UTC = HKT 17:25
    const fetchedBeforeUpgrade = card.snkrdunkUpdatedAt && new Date(card.snkrdunkUpdatedAt) < PRICE_LOGIC_UPGRADED_AT;
    // Also re-fetch if USD source price is missing (new field)
    const missingUsdSource = !card.snkrdunkPriceUsd;
    const snkUpdatedAtIsStale = !card.snkrdunkUpdatedAt || priceIsZeroOrMissing || fetchedBeforeUpgrade || missingUsdSource || snkAge > 24 * 60 * 60 * 1000;
    const needsSnkBootstrap =
        Number.isFinite(pid) &&
        pid > 0 &&
        (snkUpdatedAtIsStale || card.currency === 'USD');
    if (needsSnkBootstrap) {
        try {
            const quote = await fetchSnkrdunkTradingCardQuote(pid);
            if (quote && quote.priceJpy > 0) {
                // Only save snkrdunkUpdatedAt when we got a real price, so price=0 cards retry next load
                const setFields = {
                    price: quote.priceJpy,
                    currency: 'JPY',
                    snkrdunkUpdatedAt: new Date(),
                    updatedAt: new Date()
                };
                if (quote.pricePSA10Jpy != null) setFields.snkrdunkPricePSA10 = quote.pricePSA10Jpy;
                if (quote.pricePSA9Jpy != null) setFields.snkrdunkPricePSA9 = quote.pricePSA9Jpy;
                if (quote.priceUsd != null) setFields.snkrdunkPriceUsd = quote.priceUsd;
                if (quote.pricePSA10Usd != null) setFields.snkrdunkPricePSA10Usd = quote.pricePSA10Usd;
                if (quote.pricePSA9Usd != null) setFields.snkrdunkPricePSA9Usd = quote.pricePSA9Usd;
                await Card.updateOne({ id: card.id }, { $set: setFields });
                card = await Card.findOne({ id: card.id }).lean();
            }
        } catch (e) {
            console.error('[getCardById] SNKRDUNK quote fetch failed', card.id, e.message);
        }
    }

    return toPlainObject(card);
}

function escapeRegexForDb(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Detect if string contains CJK characters
function hasCJK(s) {
    return /[\u3000-\u9fff\uac00-\ud7af\uf900-\ufaff]/.test(s);
}

// JS relevance score — higher = more relevant
function relevanceScore(card, qLower) {
    const nameLower = (card.name || '').toLowerCase();
    const setLower = (card.set || '').toLowerCase();
    let score = 0;
    if (nameLower === qLower) score += 40;
    else if (nameLower.startsWith(qLower)) score += 30;
    else if (nameLower.includes(qLower)) score += 20;
    if (setLower === qLower) score += 10;
    else if (setLower.includes(qLower)) score += 5;
    if (card.snkrdunkProductId > 0 && card.currency !== 'USD' && card.price > 0) score += 5;
    return score;
}

// Deduplicate by card id, keeping first occurrence
function dedup(cards) {
    const seen = new Set();
    return cards.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
    });
}

// ── Set code cache ────────────────────────────────────────────────────────────
// Loaded once from DB and refreshed every 5 minutes. Allows "all" search to
// detect set code intent without a heuristic (works for any format: letters,
// digits, mixed).
let _setCodeCache = null;
let _setCodeCacheAt = 0;
const SET_CODE_CACHE_TTL = 5 * 60 * 1000;

async function getSetCodes() {
    const now = Date.now();
    if (_setCodeCache && now - _setCodeCacheAt < SET_CODE_CACHE_TTL) return _setCodeCache;
    const codes = await Card.distinct('setCode', { setCode: { $exists: true, $nin: [null, ''] } });
    _setCodeCache = codes.map(c => c.toLowerCase());
    _setCodeCacheAt = now;
    return _setCodeCache;
}

// Returns true if any known setCode starts with query (case-insensitive).
// Minimum 2 chars to avoid single-letter false triggers.
async function queryMatchesSetCode(qLower) {
    if (qLower.length < 2) return false;
    const codes = await getSetCodes();
    return codes.some(code => code.startsWith(qLower));
}

// Enhanced search: supports String or RegExp
export async function findCards(query, type = 'all') {
    await db();

    // ── setCode search: unchanged logic, uses setId/set/setCode indexes ──────
    if (type === 'setCode') {
        const strictRegex = new RegExp(`^${escapeRegexForDb(String(query))}$`, 'i');
        const cards = await Card.find({
            $or: [
                { set: { $regex: strictRegex } },
                { setId: { $regex: strictRegex } },
                { setCode: { $regex: strictRegex } }
            ]
        }).limit(500).lean();
        return toPlainObject(cards);
    }

    // ── Handle RegExp queries (e.g. from translateQuery returning "a|b") ──────
    if (query instanceof RegExp) {
        const cards = await Card.find({
            $or: [
                { name: { $regex: query } },
                { set: { $regex: query } },
                { number: { $regex: query } },
            ]
        }).limit(250).lean();
        return toPlainObject(cards);
    }

    const qstr = String(query).trim();
    if (!qstr) return [];

    const qLower = qstr.toLowerCase();
    const escaped = escapeRegexForDb(qstr);

    // ── Card number shortcut: "110" or "110/080" ─────────────────────────────
    if (/^\d{1,3}(\/\d{2,3})?$/.test(qstr)) {
        const base = qstr.split('/')[0];
        const stripped = parseInt(base, 10).toString();
        const numRegex = new RegExp(`(#${base}|#${stripped})\\b`, 'i');
        const cards = await Card.find({ name: { $regex: numRegex } }).limit(200).lean();
        return toPlainObject(cards);
    }

    let results = [];

    // ── Set code detection: check against real set codes in DB ───────────────
    // If the query is a prefix of any known setCode, treat it as a set search.
    // This works for any format (pure letters like "JTG", mixed like "m2a", etc.)
    // and returns ONLY set code results (no name results mixed in).
    if (!hasCJK(qstr) && await queryMatchesSetCode(qLower)) {
        const prefixRegex = new RegExp(`^${escaped}`, 'i');
        const cards = await Card.find({ setCode: { $regex: prefixRegex } }).limit(500).lean();
        return toPlainObject(cards);
    }

    if (hasCJK(qstr)) {
        // ── CJK path: regex on name + set only (no text index for CJK) ────────
        const regex = new RegExp(escaped, 'i');
        const cards = await Card.find({
            $or: [{ name: { $regex: regex } }, { set: { $regex: regex } }]
        }).limit(200).lean();
        results = cards;
    } else {
        // ── English path: text index primary ──────────────────────────────────
        const textResults = await Card.find(
            { $text: { $search: qstr } },
            { score: { $meta: 'textScore' } }
        ).sort({ score: { $meta: 'textScore' } }).limit(250).lean();

        // Prefix fallback: if text index returns < 5 results, supplement with
        // a fast prefix regex on the indexed name field
        let prefixResults = [];
        if (textResults.length < 5) {
            const prefixRegex = new RegExp(`^${escaped}`, 'i');
            prefixResults = await Card.find({ name: { $regex: prefixRegex } }).limit(100).lean();
        }

        results = dedup([...textResults, ...prefixResults]);
    }

    // ── JS relevance sort ─────────────────────────────────────────────────────
    results.sort((a, b) => relevanceScore(b, qLower) - relevanceScore(a, qLower));

    return toPlainObject(results);
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
        if (/korean/i.test(name)) return 'korean';
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
            coverImagePosition: meta.coverImagePosition || '50% 50%',
            coverImageZoom: meta.coverImageZoom || 1,
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
    } else if (sortBy === 'count_asc') {
        result.sort((a, b) => a.count - b.count);
    } else if (sortBy === 'date') {
        result.sort((a, b) => {
            if (!a.releaseDate && !b.releaseDate) return a.name.localeCompare(b.name);
            if (!a.releaseDate) return 1;
            if (!b.releaseDate) return -1;
            return new Date(b.releaseDate) - new Date(a.releaseDate);
        });
    } else if (sortBy === 'date_asc') {
        result.sort((a, b) => {
            if (!a.releaseDate && !b.releaseDate) return a.name.localeCompare(b.name);
            if (!a.releaseDate) return -1;
            if (!b.releaseDate) return 1;
            return new Date(a.releaseDate) - new Date(b.releaseDate);
        });
    } else if (sortBy === 'name_desc') {
        result.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        // name A-Z (default)
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
                currency: '$cardDetails.currency',
                snkrdunkProductId: '$cardDetails.snkrdunkProductId',
                snkrdunkPricePSA10: '$cardDetails.snkrdunkPricePSA10',
                snkrdunkPricePSA9: '$cardDetails.snkrdunkPricePSA9',
                snkrdunkPriceUsd: '$cardDetails.snkrdunkPriceUsd',
                snkrdunkPricePSA10Usd: '$cardDetails.snkrdunkPricePSA10Usd',
                snkrdunkPricePSA9Usd: '$cardDetails.snkrdunkPricePSA9Usd',
                set: '$cardDetails.set',
                setId: '$cardDetails.setId', // for language detection
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
