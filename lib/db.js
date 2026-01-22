

import connectToDatabase from './mongodb';
import Card from '@/models/Card';

// Helper to ensure connection
async function db() {
    await connectToDatabase();
}

// Helper to convert MongoDB docs to plain objects (removes ObjectId, Date objects, etc.)
function toPlainObject(doc) {
    return JSON.parse(JSON.stringify(doc));
}

export async function getAllCards() {
    await db();
    // Return all cards (lean for performance)
    const cards = await Card.find({}).lean();
    return toPlainObject(cards);
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
        // Escape check? simple string
        regex = new RegExp(query, 'i');
    }

    // Search multiple fields
    const cards = await Card.find({
        $or: [
            { name: { $regex: regex } },
            { nameJP: { $regex: regex } },
            { nameCN: { $regex: regex } },
            { nameEN: { $regex: regex } }
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
                $setOnInsert: { createdAt: new Date() } // keep original createdAt if exists?
            },
            upsert: true
        }
    }));

    await Card.bulkWrite(ops);
}

// 4. Get Cards by Set
export async function getCardsBySet(setName) {
    await db();
    const cards = await Card.find({ set: setName }).lean();
    return toPlainObject(cards);
}

// 5. Get Latest Boxes
export async function getLatestBoxes(limit = 4) {
    await db();
    // Filter for cardType 'box'
    // Sort by Release Date desc, then createdAt desc
    // Note: releaseDate is String YYYY-MM-DD or similar?
    // Sorting strings works for ISO dates.
    // However, currently `releaseDate` is string.

    // We can sort by releaseDate string descending.
    const boxes = await Card.find({ cardType: 'box' })
        .sort({ releaseDate: -1, createdAt: -1 })
        .limit(limit)
        .lean();
    return toPlainObject(boxes);
}

// Deprecated file-system utils shims to prevent instant crash if called, though should be unused
export function readDB() { return []; }
export function writeDB() { return false; }

