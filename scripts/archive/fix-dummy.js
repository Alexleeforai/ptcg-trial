import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fixDummy() {
    await mongoose.connect(process.env.MONGODB_URI);

    await Card.updateOne(
        { id: 'dummy-001' },
        {
            $set: {
                image: 'https://images.pokemontcg.io/xy1/1.png',
                set: 'Test Set Layout',
                setId: 'test-layout'
            }
        }
    );

    console.log("Dummy Updated.");
    process.exit(0);
}
fixDummy();
