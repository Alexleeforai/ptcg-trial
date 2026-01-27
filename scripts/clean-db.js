import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function cleanDB() {
    console.log("Connecting to DB (Direct)...");

    // Direct connection to avoid caching issues in standalone scripts
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected.");

    console.log("WARNING: Deleting ALL cards from database in 3 seconds...");
    await new Promise(r => setTimeout(r, 3000));

    const result = await Card.deleteMany({});
    console.log(`Deleted ${result.deletedCount} cards.`);

    console.log("Database Cleaned.");
    process.exit(0);
}

cleanDB().catch(err => {
    console.error(err);
    process.exit(1);
});
