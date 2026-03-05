import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function insertDummy() {
    await mongoose.connect(process.env.MONGODB_URI);

    await Card.create({
        id: 'dummy-001',
        name: 'Dummy Charizard',
        set: 'Test Set with Image',
        setId: 'test-set-img',
        image: 'https://placehold.co/400x600/png',
        cardType: 'single',
        createdAt: new Date()
    });

    console.log("Dummy Inserted.");
    process.exit(0);
}
insertDummy();
