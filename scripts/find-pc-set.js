const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function findSet() {
    await mongoose.connect(process.env.MONGODB_URI);
    const CardSchema = new mongoose.Schema({ set: String, image: String }, { strict: false, collection: 'cards' });
    const Card = mongoose.model('Card', CardSchema);

    // Find distinct sets that have images NOT from pokemontcg.io
    const cards = await Card.find({ image: { $regex: /^http/, $not: /pokemontcg\.io/ } }).limit(50);
    const sets = [...new Set(cards.map(c => c.set))];

    console.log('Sets with PriceCharting images:', sets);

    await mongoose.disconnect();
}

findSet();
