import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspectSetImages() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Aggregate sets and see available images
    const sets = await Card.aggregate([
        {
            $group: {
                _id: "$setId",
                name: { $first: "$set" },
                firstImage: { $first: "$image" },
                count: { $sum: 1 }
            }
        },
        { $limit: 5 }
    ]);

    console.log("Sets Sample:", JSON.stringify(sets, null, 2));
    process.exit(0);
}
inspectSetImages();
