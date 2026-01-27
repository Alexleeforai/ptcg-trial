import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listSets() {
    console.log("Connecting to DB (Direct)...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Aggregate distinct sets and count cards
    const sets = await Card.aggregate([
        {
            $group: {
                _id: "$set",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    console.log("Unique Sets in DB:");
    sets.forEach(s => {
        console.log(`- [${s._id}] (${s.count} cards)`);
    });

    process.exit(0);
}

listSets().catch(err => {
    console.error(err);
    process.exit(1);
});
