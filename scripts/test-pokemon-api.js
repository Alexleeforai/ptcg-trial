const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function getCard() {
    await mongoose.connect(process.env.MONGODB_URI);
    const CardSchema = new mongoose.Schema({
        name: String,
        set: String,
        number: String,
        image: String
    }, { strict: false, collection: 'cards' });
    const Card = mongoose.model('Card', CardSchema);

    // Find Reshiram
    const card = await Card.findOne({ name: { $regex: /Reshiram/ }, image: { $regex: /pricecharting/ } });

    if (!card) {
        console.log('Reshiram not found with PriceCharting image.');
        await mongoose.disconnect();
        return;
    }

    let cardNumber = card.number;
    if (!cardNumber && card.name.includes('#')) {
        const parts = card.name.split('#');
        cardNumber = parts[parts.length - 1].trim();
    }

    console.log(`Checking API for: ${card.name} (${card.set} #${cardNumber})`);

    // Query Pokemon TCG API
    const query = `set.name:"${card.set}" number:"${cardNumber}"`;
    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}`;

    // Fetch logic
    await new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.data && json.data.length > 0) {
                        const match = json.data[0];
                        console.log('Found match!');
                        console.log('ID:', match.id);
                        console.log('Set:', match.set.name);
                        console.log('Small Image:', match.images.small);
                        console.log('Large Image:', match.images.large);
                    } else {
                        console.log('No match found in API.');
                    }
                } catch (e) {
                    console.error('Error parsing JSON', e);
                }
                resolve();
            });
        }).on('error', (e) => {
            console.error(e);
            resolve();
        });
    });

    await mongoose.disconnect();
}

getCard();
