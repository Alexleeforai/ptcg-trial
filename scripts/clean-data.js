
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'cards.json');

function clean() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        const cards = JSON.parse(data);

        console.log(`Original count: ${cards.length}`);

        // Keywords to exclude
        const suspiciousKeywords = [
            'One Piece', 'ONEPIECE', 'OP-', 'OP0',
            'Monkey', 'Luffy', 'Zoro', 'Nami', 'Sanji', 'Chopper', 'Law', 'Kid', 'Yamato', 'Kaido', 'Shanks', 'Ace', 'Sabo', 'Uta',
            'Yu-Gi-Oh', 'Yugioh',
            'Dragon Ball', 'Dragonball',
            'Union Arena',
            'Weiss Schwarz',
            'Duel Masters',
            'Digimon',
            'Vanguard',
            'ReZero',
            'Hololive'
        ];

        const remaining = cards.filter(c => {
            const name = c.name || '';
            const set = c.set || '';
            const combined = (name + ' ' + set).toLowerCase();

            // Return true if it does NOT contain any suspicious keyword
            const isSuspicious = suspiciousKeywords.some(k => combined.includes(k.toLowerCase()));
            return !isSuspicious;
        });

        const removedCount = cards.length - remaining.length;

        if (removedCount > 0) {
            fs.writeFileSync(DB_PATH, JSON.stringify(remaining, null, 2));
            console.log(`\nSuccessfully removed ${removedCount} items.`);
            console.log(`New count: ${remaining.length}`);
        } else {
            console.log('\nNo items matched filter criteria. Database untouched.');
        }

    } catch (e) {
        console.error("Error cleaning DB:", e);
    }
}

clean();
