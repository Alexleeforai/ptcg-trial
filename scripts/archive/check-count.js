import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkCount() {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Card.countDocuments({});
    const priced = await Card.countDocuments({ price: { $gt: 0 } });
    const setNames = await Card.distinct("set");

    console.log(`Total Cards: ${count}`);
    console.log(`Priced Cards: ${priced}`);
    console.log(`Sets Covered: ${setNames.length}`);

    // Sample
    const sample = await Card.findOne();
    if (sample) {
        console.log("Sample:", sample.id, sample.name, sample.price, sample.currency);
    }

    process.exit(0);
}
checkCount().catch(console.error);
