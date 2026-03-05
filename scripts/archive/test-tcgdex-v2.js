const https = require('https');

// TCGdex API endpoint for Japanese cards
// Use 'ja' instead of 'jp'
const url = 'https://api.tcgdex.net/v2/ja/cards?name=リザードン';

console.log(`Fetching from: ${url}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const cards = JSON.parse(data); // Returns array directly?

            if (Array.isArray(cards)) {
                console.log(`Found ${cards.length} cards`);
                // Print first 5 results
                cards.slice(0, 5).forEach(card => {
                    console.log("-----------------------------------");
                    console.log(`ID: ${card.id}`);
                    console.log(`Name: ${card.name}`);
                    console.log(`Image: ${card.image}`);
                });
            } else {
                console.log("Response is not an array:", JSON.stringify(cards, null, 2));
            }

        } catch (e) {
            console.error("Parse Error:", e.message);
            console.log("Raw Data:", data.substring(0, 500));
        }
    });
}).on('error', (e) => {
    console.error("Network Error:", e);
});
