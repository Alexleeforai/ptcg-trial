import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function surgicalCleanV2() {
    console.log("Connecting (Direct)...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Pattern: [...-JP...]
    // YGO OCG Set codes always look like [SD43-JP026], [SAST-JP060]
    // Pokemon usually [sv4a 001/190]

    const regex = /\[[A-Za-z0-9]+-JP[A-Za-z0-9]*\]/;

    console.log("Scanning for YGO ID Pattern: [...-JP...] ...");

    const filter = { name: { $regex: regex } };

    const count = await Card.countDocuments(filter);

    if (count > 0) {
        console.log(`Found ${count} YGO matches (by Set ID pattern).`);

        // Show sample
        const samples = await Card.find(filter).limit(5).select('name');
        samples.forEach(s => console.log(`  Target: ${s.name}`));

        console.log("Deleting...");
        const res = await Card.deleteMany(filter);
        console.log(`Deleted ${res.deletedCount} cards.`);
    } else {
        console.log("No matches found.");
    }

    process.exit(0);
}

surgicalCleanV2().catch(console.error);
