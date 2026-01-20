const https = require('https');

// Query for "Charizard ex" to see what comes back
const url = 'https://api.pokemontcg.io/v2/cards?q=name:"Charizard ex"&pageSize=5';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Count:", json.count);
            if (json.data && json.data.length > 0) {
                json.data.forEach(card => {
                    console.log("---------------------------------------------------");
                    console.log(`Name: ${card.name}`);
                    console.log(`ID: ${card.id}`);
                    console.log(`Set: ${card.set.name} (Series: ${card.set.series})`);
                    console.log(`Number: ${card.number}`);
                    if (card.tcgplayer) {
                        console.log("TCGPlayer Data:", JSON.stringify(card.tcgplayer, null, 2));
                    } else {
                        console.log("TCGPlayer Data: NONE");
                    }
                    if (card.cardmarket) {
                        console.log("Cardmarket Data:", JSON.stringify(card.cardmarket, null, 2));
                    }
                });
            }
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
