const https = require('https');

// TCGdex API endpoint for Japanese cards
// Search for 'リザードン' (Charizard)
const url = 'https://api.tcgdex.net/v2/jp/cards?name=リザードン';

console.log(`Fetching from: ${url}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const cards = JSON.parse(data);
            console.log(`Found ${cards.length} cards`);

            // Print first 5 results
            cards.slice(0, 5).forEach(card => {
                console.log("-----------------------------------");
                console.log(`ID: ${card.id}`);
                console.log(`Name: ${card.name}`);
                console.log(`Image: ${card.image}/high.png or /low.png`);
                // Note: TCGdex often returns image base path, need to append quality
            });

        } catch (e) {
            console.error("Parse Error:", e.message);
            console.log("Raw Data:", data.substring(0, 500));
        }
    });
}).on('error', (e) => {
    console.error("Network Error:", e);
});
