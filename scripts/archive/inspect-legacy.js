import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspectLegacy() {
    console.log("Connecting...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Get 10 random cards from legacy set (SNKRDUNK is likely the only set, but let's check generic)
    const cards = await Card.aggregate([
        { $match: { set: 'SNKRDUNK' } },
        { $sample: { size: 10 } },
        { $project: { name: 1, id: 1 } }
    ]);

    console.log("Legacy Samples:");
    cards.forEach(c => console.log(`- [${c.id}] ${c.name}`));

    // Get samples containing "Piece" or "Duel" again to see patterns of BAD cards
    const bad = await Card.find({
        name: { $regex: /Piece|Duel|Eyes/i },
        set: 'SNKRDUNK'
    }).limit(5).select('name id');

    console.log("\nBad Samples:");
    bad.forEach(c => console.log(`- [${c.id}] ${c.name}`));

    process.exit(0);
}

inspectLegacy().catch(console.error);
