import connectToDatabase from '../lib/mongodb.js';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function countCards() {
    console.log("Connecting to DB...");
    // Fix: connectToDatabase is default export in lib/mongodb.js?
    // checking lib/db.js: import connectToDatabase from './mongodb.js'; -> export default connectToDatabase;
    // So here I should import default.
    const mongoose = await import('mongoose');

    // Actually, let's just use the existing lib/db.js if possible, but it might not have count.
    // Let's rely on Mongoose directly if I can import the model.
    // But Card.js might rely on mongoose connection.

    // Easier way: copy connection logic or use the one in lib/db.js?
    // lib/db.js has `async function db()` not exported.

    // Let's reproduce connection logic simply.
    await mongoose.connect(process.env.MONGODB_URI);

    const count = await Card.countDocuments({});
    console.log(`\nTotal Cards in Database: ${count}\n`);

    // Count by type/currency for more detail
    const jpCount = await Card.countDocuments({ currency: 'JPY' });
    const enCount = await Card.countDocuments({ currency: 'USD' }); // or 'currency' existence?
    // Actually, 'currency' defaults to 'JPY' in schema? Let's check schema.
    // If I updated schema, I should check.

    console.log(`JP Cards (approx): ${jpCount}`);
    console.log(`EN Cards (approx): ${enCount}`);

    process.exit(0);
}

countCards().catch(console.error);
