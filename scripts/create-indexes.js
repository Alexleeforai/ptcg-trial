import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Card from '../models/Card.js';

dotenv.config({ path: '.env.local' });

async function createIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        console.log('Creating Indexes on "cards" collection...');

        // 1. Set ID (Critical for Browse Page Grouping & Filtering)
        console.log('- Indexing: setId, set');
        await Card.collection.createIndex({ setId: 1 });
        await Card.collection.createIndex({ set: 1 });

        // 2. Sorting & Stats
        console.log('- Indexing: views, updatedAt, createdAt');
        await Card.collection.createIndex({ views: -1 });
        await Card.collection.createIndex({ updatedAt: -1 });
        await Card.collection.createIndex({ createdAt: -1 });

        // 3. Image (Browsing prioritized)
        console.log('- Indexing: image');
        await Card.collection.createIndex({ image: 1 });

        // 4. Compound Index for Browse Page (Optimization)
        // Browse page usually does: Sort by Image -> Group by Set
        // But aggregation indexes are tricky. Simple indexes are usually enough.

        console.log('✅ Indexes Created Successfully!');

        // List Indexes
        const indexes = await Card.collection.indexes();
        console.log('\nCurrent Indexes:');
        console.log(indexes);

    } catch (error) {
        console.error('Error creating indexes:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createIndexes();
