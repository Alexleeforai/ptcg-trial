import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkPrices() {
    await mongoose.connect(process.env.MONGODB_URI);

    const total = await Card.countDocuments({});
    const withImage = await Card.countDocuments({ image: { $ne: null } });
    const withPriceRaw = await Card.countDocuments({ priceRaw: { $gt: 0 } });
    const withPSA10 = await Card.countDocuments({ pricePSA10: { $gt: 0 } });

    console.log(`Total Cards: ${total}`);
    console.log(`With Image: ${withImage}`);
    console.log(`With Raw Price: ${withPriceRaw}`);
    console.log(`With PSA10 Price: ${withPSA10}`);

    // Sample with prices
    const sample = await Card.findOne({ priceRaw: { $gt: 0 } });
    if (sample) {
        console.log("Sample with price:", sample.name, sample.priceRaw, sample.priceGrade9, sample.pricePSA10);
    } else {
        console.log("No cards with prices found.");
        // Sample any card
        const any = await Card.findOne({});
        if (any) {
            console.log("Sample card:", any.name, "Image:", any.image ? "Yes" : "No", "priceRaw:", any.priceRaw);
        }
    }

    process.exit(0);
}
checkPrices();
