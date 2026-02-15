const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function testUpgrade() {
    await mongoose.connect(process.env.MONGODB_URI);
    const CardSchema = new mongoose.Schema({
        name: String,
        set: String,
        number: String,
        image: String
    }, { strict: false, collection: 'cards' });
    const Card = mongoose.model('Card', CardSchema);

    // Filter for Shining Legends cards with PriceCharting/low-quality images
    const cards = await Card.find({
        set: 'Shining Legends',
        image: { $regex: /^http/, $not: /pokemontcg\.io/ }
    });

    console.log(`Found ${cards.length} cards in "Shining Legends" to check.`);
    console.log('--------------------------------------------------');
    console.log('Card Name | Current Image | New Image Candidate');
    console.log('--------------------------------------------------');

    let matchCount = 0;

    // Limit to 10 for demo to user
    const subset = cards.slice(0, 10);
    console.log(`Checking first ${subset.length} cards...`);

    for (const card of subset) {
        let cardNumber = card.number;
        if (!cardNumber && card.name.includes('#')) {
            const parts = card.name.split('#');
            cardNumber = parts[parts.length - 1].trim();
        }

        const query = `set.name:"${card.set}" number:"${cardNumber}"`;
        const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}`;

        let success = false;
        let retries = 3;

        while (retries > 0 && !success) {
            try {
                const result = await fetchJson(url);
                if (result.data && result.data.length > 0) {
                    const match = result.data[0];
                    console.log(`✅ MATCH: ${card.name} \n   -> Old: ${shortUrl(card.image)} \n   -> New: ${match.images.large}`);
                    matchCount++;
                } else {
                    console.log(`❌ NO MATCH: ${card.name}`);
                }
                success = true;
            } catch (e) {
                retries--;
                if (retries === 0) console.log(`⚠️ ERROR: ${card.name} | ${e.message}`);
                await new Promise(r => setTimeout(r, 2000)); // Wait 2s on error
            }
        }

        // Rate limit kindness
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('--------------------------------------------------');
    console.log(`Demo Complete: ${matchCount}/${subset.length} matched.`);
    await mongoose.disconnect();
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Status Code: ${res.statusCode}`));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function shortUrl(url) {
    if (!url) return 'null';
    if (url.includes('pokemontcg.io')) return 'HIGH-RES';
    if (url.includes('pricecharting')) return 'PC-LowRes';
    if (url.includes('snkrdunk')) return 'Snkr-LowRes';
    return 'Other';
}

testUpgrade();
