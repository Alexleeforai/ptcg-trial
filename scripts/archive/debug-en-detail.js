const https = require('https');

// Get details of a Charizard card from EN endpoint
const url = 'https://api.tcgdex.net/v2/en/cards?name=Charizard';

console.log(`Fetching from: ${url}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const results = JSON.parse(data);
            if (results.length > 0) {
                const firstId = results[0].id; // e.g. swsh3-20
                console.log(`Checking details for ID: ${firstId}`);

                const detailUrl = `https://api.tcgdex.net/v2/en/cards/${firstId}`;
                https.get(detailUrl, (res2) => {
                    let data2 = '';
                    res2.on('data', (chunk) => { data2 += chunk; });
                    res2.on('end', () => {
                        const detail = JSON.parse(data2);
                        console.log("Name:", detail.name);
                        console.log("LocalId:", detail.localId);
                        // Check for translation fields?
                        console.log("Keys:", Object.keys(detail));
                        if (detail.nameJP) console.log("nameJP:", detail.nameJP); // Hypothesizing
                    });
                });
            }
        } catch (e) {
            console.error("Parse Error:", e.message);
        }
    });
}).on('error', (e) => {
    console.error("Network Error:", e);
});
