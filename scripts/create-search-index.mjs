/**
 * create-search-index.mjs
 * One-time script to create a MongoDB text index on the cards collection.
 * Run locally: node scripts/create-search-index.mjs
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const Card = mongoose.model('Card', new mongoose.Schema({}, { strict: false }));

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collection = Card.collection;

    // Drop existing text index if any
    try {
        const indexes = await collection.indexes();
        const textIdx = indexes.find(i => Object.values(i.key).includes('text'));
        if (textIdx) {
            console.log('Dropping existing text index:', textIdx.name);
            await collection.dropIndex(textIdx.name);
        }
    } catch (e) {
        console.log('No existing text index to drop');
    }

    // Create text index on name + set + number
    // default_language: 'none' — no stemming, works for all languages including CJK romanisation
    // weights: name is most important, then set, then number
    console.log('Creating text index...');
    await collection.createIndex(
        { name: 'text', set: 'text', number: 'text' },
        {
            weights: { name: 10, set: 3, number: 2 },
            default_language: 'none',
            name: 'cards_text_search',
        }
    );

    // Also add index on setCode if not already there
    const indexes = await collection.indexes();
    const hasSetCodeIdx = indexes.some(i => i.key?.setCode);
    if (!hasSetCodeIdx) {
        console.log('Creating setCode index...');
        await collection.createIndex({ setCode: 1 });
    }

    // Add index on name for prefix search fallback
    const hasNameIdx = indexes.some(i => i.key?.name && !Object.values(i.key).includes('text'));
    if (!hasNameIdx) {
        console.log('Creating name index...');
        await collection.createIndex({ name: 1 });
    }

    console.log('\nAll indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(i => console.log(' ', JSON.stringify(i.key), '-', i.name));

    await mongoose.disconnect();
    console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
