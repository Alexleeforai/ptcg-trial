import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function nukeSnkrdunk() {
    console.log("Connecting (Direct)...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Filter: Set='SNKRDUNK' OR ID starts with 'snkr-'
    const filter = {
        $or: [
            { set: 'SNKRDUNK' },
            { id: { $regex: /^snkr-/ } }
        ]
    };

    const count = await Card.countDocuments(filter);
    console.log(`Found ${count} Legacy SNKRDUNK cards.`);

    if (count > 0) {
        console.log("Deleting ALL Legacy Data...");
        const res = await Card.deleteMany(filter);
        console.log(`Deleted ${res.deletedCount} cards.`);
    }

    // Check remaining
    const remaining = await Card.countDocuments({});
    console.log(`Remaining Clean Cards: ${remaining}`);

    process.exit(0);
}

nukeSnkrdunk().catch(console.error);
