import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const cards = db.collection('cards');
    
    const sample = await cards.find({ name: { $regex: /#110/ } }).limit(5).toArray();
    
    console.log("Sample cards with #110 in name:");
    sample.forEach(c => {
        console.log(JSON.stringify(c, null, 2));
    });
    
    process.exit(0);
}
run();
