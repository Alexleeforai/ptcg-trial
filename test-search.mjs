import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const cards = db.collection('cards');
    
    // Find a card that actually has 110/080 in its name or anywhere
    const sample = await cards.find({ $or: [{ name: { $regex: /110/ } }, { nameJP: { $regex: /110/ } }] }).limit(5).toArray();
    
    console.log("Sample cards with 110 in name:");
    sample.forEach(c => {
        console.log({ name: c.name, number: c.number, set: c.set });
    });
    
    process.exit(0);
}
run();
