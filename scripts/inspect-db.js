import connectToDatabase from '../lib/mongodb.js';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspectCards() {
    await connectToDatabase();

    console.log("Sampling 20 random cards...");
    const cards = await Card.aggregate([{ $sample: { size: 20 } }]);

    cards.forEach(c => {
        console.log(`ID: ${c.id} | Name: ${c.name} | Set: ${c.set} | Currency: ${c.currency}`);
    });

    // Check for potential Yu-Gi-Oh keywords
    console.log("\nSearching for 'Dragon' or familiar YGO terms...");
    const ygo = await Card.find({ name: { $regex: /Eyes|Dragon|Magician/i } }).limit(5);
    ygo.forEach(c => {
        console.log(`[Possible YGO] ID: ${c.id} | Name: ${c.name}`);
    });

    process.exit(0);
}

inspectCards().catch(console.error);
