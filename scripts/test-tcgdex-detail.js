const https = require('https');

// Test fetching details for 'SV2a-006' (Charizard ex from Pokemon 151)
const url = 'https://api.tcgdex.net/v2/ja/cards/SV2a-006';

console.log(`Fetching from: ${url}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const card = JSON.parse(data);
            console.log("-----------------------------------");
            console.log(`ID: ${card.id}`);
            console.log(`Name: ${card.name}`);
            console.log(`Image: ${card.image}`);
            if (card.set) {
                console.log(`Set Name: ${card.set.name}`);
                console.log(`Set ID: ${card.set.id}`);
            }
            console.log(`Rarity: ${card.rarity}`);
            console.log(`LocalId: ${card.localId}`); // Likely the number
            console.log("Full Object Keys:", Object.keys(card));

        } catch (e) {
            console.error("Parse Error:", e.message);
        }
    });
}).on('error', (e) => {
    console.error("Network Error:", e);
});
