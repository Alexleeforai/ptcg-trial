
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'cards.json');

function audit() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        const cards = JSON.parse(data);

        console.log(`Total cards: ${cards.length}`);

        // Keywords to look for
        const suspiciousKeywords = [
            'One Piece', 'OP-', 'OP0',
            'Yu-Gi-Oh', 'Yugioh',
            'Dragon Ball', 'Dragonball',
            'Union Arena',
            'Weiss Schwarz',
            'Duel Masters',
            'Digimon'
        ];

        const suspicious = cards.filter(c => {
            const name = c.name || '';
            const set = c.set || '';
            const combined = (name + ' ' + set).toLowerCase();

            return suspiciousKeywords.some(k => combined.includes(k.toLowerCase()));
        });

        console.log(`Found ${suspicious.length} suspicious items.`);

        if (suspicious.length > 0) {
            console.log('\nExamples:');
            suspicious.slice(0, 20).forEach(c => {
                console.log(`[${c.id}] ${c.name} (Set: ${c.set})`);
            });
        }

    } catch (e) {
        console.error("Error reading DB:", e);
    }
}

audit();
