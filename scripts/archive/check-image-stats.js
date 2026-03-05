import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkImageStats() {
    console.log("Connecting (Direct)...");
    await mongoose.connect(process.env.MONGODB_URI);

    const total = await Card.countDocuments({});

    // Explicitly count NULL
    const nullCount = await Card.countDocuments({ image: null });

    // Explicitly count Empty String
    const emptyCount = await Card.countDocuments({ image: '' });

    // Explicitly count Valid (exists, not null, not empty)
    const validCount = await Card.countDocuments({
        image: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`Total Cards: ${total}`);
    console.log(`Null Images: ${nullCount}`);
    console.log(`Empty Images: ${emptyCount}`);
    console.log(`Valid Images: ${validCount}`);

    if (nullCount > 0) {
        console.log(`Sample Null: ${(await Card.findOne({ image: null })).id}`);
    }

    process.exit(0);
}

checkImageStats().catch(console.error);
