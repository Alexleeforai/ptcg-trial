import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function detectBadCards() {
    console.log("Connecting...");
    await mongoose.connect(process.env.MONGODB_URI);

    const keywords = ['Yu-Gi', 'Duel', 'Eyes', 'Magician', 'Luffy', 'Zoro', 'Sanji', 'Piece', 'Goku', 'Dragon Ball'];

    console.log(`Scanning for keywords: ${keywords.join(', ')}...`);

    let totalBad = 0;

    for (const kw of keywords) {
        const count = await Card.countDocuments({ name: { $regex: kw, $options: 'i' } });
        if (count > 0) {
            console.log(`- "${kw}": ${count} matches`);
            const samples = await Card.find({ name: { $regex: kw, $options: 'i' } }).limit(3).select('name');
            samples.forEach(s => console.log(`  > ${s.name}`));
            totalBad += count;
        }
    }

    console.log(`\nNote: 'Dragon' keyword is risky because Pokemon has Dragon type/names.`);
    const dragonCount = await Card.countDocuments({ name: { $regex: 'Dragon', $options: 'i' } });
    console.log(`- "Dragon": ${dragonCount} matches (Check manually)`);

    process.exit(0);
}

detectBadCards().catch(console.error);
