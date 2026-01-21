import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'cards.json');

// Ensure DB file exists
function ensureDB() {
    if (!fs.existsSync(DB_PATH)) {
        // Ensure directory exists
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
    }
}

export function readDB() {
    ensureDB();
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        const json = JSON.parse(data);
        // console.log(`[DB] Read ${json.length} cards from ${DB_PATH}`);
        return json;
    } catch (e) {
        console.error("Error reading DB:", e);
        return [];
    }
}

export function writeDB(data) {
    ensureDB();
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error("Error writing DB:", e);
        return false;
    }
}

// Enhanced search: supports String or RegExp
export function findCards(query) {
    const cards = readDB();

    let matcher;
    if (query instanceof RegExp) {
        matcher = (val) => query.test(val);
    } else {
        const qLower = query.toLowerCase();
        matcher = (val) => val && val.toLowerCase().includes(qLower);
    }

    // Simple filter: name includes query
    // In future, could add fuse.js for fuzzy search
    return cards.filter(c =>
        matcher(c.name) ||
        matcher(c.nameJP) ||
        matcher(c.nameCN) ||
        (c.nameEN && matcher(c.nameEN))
    );
}

export function upsertCards(newCards) {
    const currentCards = readDB();
    let updated = false;

    newCards.forEach(newCard => {
        const index = currentCards.findIndex(c => c.id === newCard.id);
        if (index >= 0) {
            // Update existing
            // Only update fields that are present/newer
            currentCards[index] = { ...currentCards[index], ...newCard, updatedAt: new Date().toISOString() };
        } else {
            // Insert new
            currentCards.push({ ...newCard, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
        updated = true;
    });

    if (updated) {
        writeDB(currentCards);
    }
}

export function getCardById(id) {
    const cards = readDB();
    return cards.find(c => c.id === id);
}

// 4. Get Cards by Set
export function getCardsBySet(setName) {
    const cards = readDB();
    return cards.filter(c => c.set === setName);
}

// 5. Get Latest Boxes
export function getLatestBoxes(limit = 4) {
    const cards = readDB();
    // Filter for cardType 'box' or fallback logic if type missing
    const boxes = cards.filter(c => c.cardType === 'box');

    // Sort by Release Date desc, then createdAt desc
    boxes.sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;

        if (dateA !== dateB) {
            return dateB - dateA; // Newest Release First
        }

        // Fallback to createdAt if release dates equal or missing
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return boxes.slice(0, limit);
}


export function getAllCards() {
    return readDB();
}
