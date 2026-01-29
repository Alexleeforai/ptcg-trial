import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspectCards() {
    const key = process.env.JUSTTCG_API_KEY;
    const baseUrl = 'https://api.justtcg.com/v1';

    // 1. Fetch Sets
    console.log("Fetching sets...");
    const sRes = await fetch(`${baseUrl}/sets?game=pokemon-japan`, { headers: { 'x-api-key': key } });
    const sData = await sRes.json();
    const sets = sData.data || [];

    // 2. Find Shiny Treasure
    // Look for 'Shiny Treasure' or 'sv4a' in name/code
    const targetSet = sets.find(s =>
        (s.name && s.name.toLowerCase().includes('shiny treasure')) ||
        (s.code && s.code.toLowerCase() === 'sv4a')
    );

    if (!targetSet) {
        console.log("Shiny Treasure set not found. Sample sets:");
        sets.slice(0, 5).forEach(s => console.log(`- ${s.id} (${s.name})`));
        return;
    }

    console.log(`Found Set: ${targetSet.name} (ID: ${targetSet.id})`);

    // 3. Fetch Cards
    // Try /cards?set=ID or /sets/ID/cards?
    // Try query param first as per pattern
    const cUrl = `${baseUrl}/cards?game=pokemon-japan&set_id=${targetSet.id}`;
    // Note: Parameter might be 'set', 'set_id', 'setId'?
    // I'll try 'set_id' based on intuition or 'set'.
    // Let's try both or check docs if search said anything. 
    // Docs said "/cards ... flexible search tool".

    console.log(`Fetching cards from ${cUrl}...`);
    const cRes = await fetch(cUrl, { headers: { 'x-api-key': key } });
    if (!cRes.ok) {
        console.log(`Error: ${cRes.status}`);
        // Try path?
        const cUrl2 = `${baseUrl}/sets/${targetSet.id}/cards`;
        console.log(`Trying ${cUrl2}...`);
        const cRes2 = await fetch(cUrl2, { headers: { 'x-api-key': key } });
        if (cRes2.ok) {
            const json2 = await cRes2.json();
            printCards(json2.data);
        } else {
            console.log(`Error 2: ${cRes2.status}`);
        }
        return;
    }

    const cData = await cRes.json();
    printCards(cData.data);
}

function printCards(cards) {
    if (!cards || cards.length === 0) {
        console.log("No cards found.");
        return;
    }
    console.log(`Found ${cards.length} cards.`);
    const sample = cards[0];
    console.log("Keys:", Object.keys(sample));
    console.log("Sample Card:", JSON.stringify(sample, null, 2));
}

inspectCards();
