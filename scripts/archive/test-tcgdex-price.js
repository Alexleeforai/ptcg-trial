async function testTCGdexPrice() {
    // Try to fetch a JP card
    const cardId = "sv4a-001"; // Oddish
    const url = `https://api.tcgdex.net/v2/ja/cards/${cardId}`;

    console.log(`Fetching ${url}...`);

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error("Error:", res.status);
            return;
        }

        const data = await res.json();
        console.log("Card Name:", data.name);

        if (data.variants) {
            console.log("Variations available:", Object.keys(data.variants));
        }

        // Check for top-level price fields or deeper structures
        // TCGdex often has 'cardmarket' or 'tcgplayer' fields?
        // Let's print keys to be sure
        console.log("Keys:", Object.keys(data));

        if (data.pricing) {
            console.log("Pricing Data:", JSON.stringify(data.pricing, null, 2));
        } else {
            console.log("No 'pricing' field found.");
        }

    } catch (e) {
        console.error(e);
    }
}

testTCGdexPrice();
