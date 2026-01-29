import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const total = await Card.countDocuments({ image: { $ne: null } });
    console.log(`Cards with Images: ${total}`);

    // Sample
    const sample = await Card.findOne({ image: { $ne: null } });
    if (sample) console.log("Sample:", sample.image);

    process.exit(0);
}
check();
