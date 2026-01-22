
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Card from '../models/Card.js';

// Load env vars
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI in .env.local");
    process.exit(1);
}

async function migrate() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    // Read cards.json
    const jsonPath = path.join(__dirname, '../data/cards.json');
    if (!fs.existsSync(jsonPath)) {
        console.error("cards.json not found!");
        process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const cards = JSON.parse(rawData);
    console.log(`Found ${cards.length} cards in JSON.`);

    // Clear existing collection? Maybe safer to upsert.
    // Let's drop and replace to be clean for initial migration.
    // console.log("Clearing existing cards collection...");
    // await Card.deleteMany({}); 

    console.log("Migrating data...");
    let count = 0;

    // Batch processing
    const batchSize = 100;
    for (let i = 0; i < cards.length; i += batchSize) {
        const batch = cards.slice(i, i + batchSize);
        const ops = batch.map(card => ({
            updateOne: {
                filter: { id: card.id },
                update: { $set: card },
                upsert: true
            }
        }));

        await Card.bulkWrite(ops);
        count += batch.length;
        process.stdout.write(`\rProcessed ${count}/${cards.length}`);
    }

    console.log("\nMigration complete!");
    await mongoose.disconnect();
}

migrate().catch(e => {
    console.error(e);
    process.exit(1);
});
