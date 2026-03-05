import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspectE4() {
    console.log("Connecting...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Find E4 cards
    const card = await Card.findOne({ id: { $regex: /E4-031/ } }); // Might be jp-E4-031
    console.log("Card found:", card ? card.id : "None");
    if (card) {
        console.log("Image:", card.image);
        console.log("Type:", typeof card.image);
    }

    // Find ANY card with null image
    const nullImg = await Card.findOne({ image: null });
    console.log("Sample Null Image Card:", nullImg ? nullImg.id : "None");

    process.exit(0);
}
inspectE4();
