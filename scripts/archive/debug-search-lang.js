const https = require('https');

// Test searching for 'Charizard' (English) on 'ja' endpoint
const url = 'https://api.tcgdex.net/v2/ja/cards?name=Charizard';

console.log(`Fetching from: ${url}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("Response Status:", res.statusCode);
        try {
            const result = JSON.parse(data);
            if (Array.isArray(result)) {
                console.log(`Found ${result.length} cards`);
                if (result.length === 0) console.log("Result is EMPTY array.");
            } else {
                console.log("Response is not an array:", result);
            }
        } catch (e) {
            console.error("Parse Error:", e.message);
        }
    });
}).on('error', (e) => {
    console.error("Network Error:", e);
});
