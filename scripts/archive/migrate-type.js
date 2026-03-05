const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'cards.json');

// Keywords that indicate an item is a Box/Set/Pack product, NOT a single card
const BOX_KEYWORDS = [
    'Box', 'Booster Pack', 'Bundle', 'Elite Trainer Box', 'Special Deck Set',
    'Premium Collection', 'Expansion Pack', 'Reinforcement Expansion Pack',
    'High Class Pack', 'Start Deck', 'Starter Set'
];

// Keywords that indicate it's definitely a Single Card (even if it has "Box" in the set name)
const SINGLE_KEYWORDS = [
    'SAR', 'SR', 'UR', 'CHR', 'CSR', 'AR', 'HR', 'RR', 'RRR',
    'Promo', 'Pikachu', 'Charizard', // Pokemon names usually start singles
    '/' // Single cards usually have numbering like 001/100
];

function classifyCard(card) {
    const name = card.name || '';

    // Check if it has card numbering (e.g. 001/100) -> Likely Single
    if (/\d{3}\/\d{3}/.test(name) || /\[.* \d+\/\d+.*\]/.test(name)) {
        return 'single';
    }

    // Check if name ends with "Box" or strictly contains box keywords without being a single
    // SNKRDUNK naming: "Pokemon Card Game ... Box" -> Box
    // "Pikachu [Set Name Box]" -> Single

    // If name starts with "Pokemon Card Game" or "One Piece", likely a box/pack unless it has specific card attributes
    if (name.startsWith('Pokemon Card Game') || name.startsWith('ONE PIECE')) {
        // Further check if it looks like a single
        if (name.includes('[')) return 'single'; // [S8a...] usually matches single
        return 'box';
    }

    if (BOX_KEYWORDS.some(k => name.includes(k))) {
        // Double check it's not a single logic
        if (name.includes('[') && name.includes(']')) {
            // Stuff inside brackets usually implies card number/set, so it's a single
            return 'single';
        }
        return 'box';
    }

    return 'single';
}

function migrate() {
    if (!fs.existsSync(DB_PATH)) {
        console.error("DB not found at", DB_PATH);
        return;
    }

    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    let boxes = 0;
    let singles = 0;

    const migrated = data.map(card => {
        const type = classifyCard(card);
        if (type === 'box') boxes++;
        else singles++;

        return {
            ...card,
            cardType: type
        };
    });

    fs.writeFileSync(DB_PATH, JSON.stringify(migrated, null, 2));
    console.log(`Migration Complete.`);
    console.log(`- Boxes/Sets: ${boxes}`);
    console.log(`- Singles: ${singles}`);
}

migrate();
