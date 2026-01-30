import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getBrowseSets } from '../lib/db.js';

dotenv.config({ path: '.env.local' });

async function testSorting() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    console.log('\n--- Testing Sort: NAME (Default) ---');
    const byName = await getBrowseSets('name');
    console.log(byName.slice(0, 3).map(s => `${s.name} (${s.count})`));

    console.log('\n--- Testing Sort: COUNT ---');
    const byCount = await getBrowseSets('count');
    console.log(byCount.slice(0, 3).map(s => `${s.name} (${s.count})`));

    console.log('\n--- Testing Sort: DATE (Newest) ---');
    const byDate = await getBrowseSets('date');
    console.log(byDate.slice(0, 3).map(s => `${s.name} (${s.count})`));

    process.exit(0);
}

testSorting().catch(console.error);
