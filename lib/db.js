
import connectToDatabase from './mongodb';
import Card from '@/models/Card';

// Helper to ensure connection
async function db() {
    await connectToDatabase();
}

export async function getAllCards() {
    await db();
    // Return all cards (lean for performance)
    return Card.find({}).lean();
}

export async function getCardById(id) {
    await db();
    const card = await Card.findOne({ id }).lean();
    return card;
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
    return Card.find({
        $or: [
            { name: { $regex: regex } },
            { nameJP: { $regex: regex } },
            { nameCN: { $regex: regex } },
            { nameEN: { $regex: regex } }
        ]
    }).lean();
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
    return Card.find({ set: setName }).lean();
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
    return Card.find({ cardType: 'box' })
        .sort({ releaseDate: -1, createdAt: -1 })
        .limit(limit)
        .lean();
}

// Deprecated file-system utils shims to prevent instant crash if called, though should be unused
export function readDB() { return []; }
export function writeDB() { return false; }

