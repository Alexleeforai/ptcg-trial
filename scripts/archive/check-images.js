import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkImages() {
    console.log("Connecting (Direct)...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Check cards with images (random sample)
    const cards = await Card.aggregate([
        { $match: { image: { $exists: true, $ne: '' } } },
        { $sample: { size: 5 } },
        { $project: { name: 1, image: 1, id: 1, setId: 1 } }
    ]);

    console.log("Image Samples:");
    cards.forEach(c => console.log(`- [${c.id}] ${c.image}`));

    process.exit(0);
}

checkImages().catch(console.error);
