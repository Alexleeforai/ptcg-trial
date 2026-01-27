import connectToDatabase from '../lib/mongodb.js';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkPrices() {
    await connectToDatabase();

    console.log("Checking prices for Set 'sv4a' (JP New Cards)...");
    const cards = await Card.find({ set: 'sv4a' }).limit(5);

    if (cards.length === 0) {
        console.log("No 'sv4a' cards found.");
    } else {
        cards.forEach(c => {
            console.log(`Card: ${c.name} | Price: ${c.price} | Currency: ${c.currency}`);
        });
    }

    process.exit(0);
}

checkPrices().catch(console.error);
