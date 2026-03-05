const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Define dummy schema to read 'cards' collection
    const CardSchema = new mongoose.Schema({}, { strict: false, collection: 'cards' });
    const Card = mongoose.model('Card', CardSchema);

    // Find a card with an image NOT from pokemontcg.io
    const card = await Card.findOne({ image: { $regex: /^http/, $not: /pokemontcg\.io/ } });

    if (card) {
        console.log('Card Name:', card.name);
        console.log('Image URL:', card.image);
    } else {
        console.log('No non-pokemontcg card found');
    }

    await mongoose.disconnect();
}

check();
