import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testJustTCGJapan() {
    const key = process.env.JUSTTCG_API_KEY;
    const baseUrl = 'https://api.justtcg.com/v1';

    console.log("Testing JustTCG (Pokemon Japan)...");

    // 1. Find Game ID
    console.log(`fetching games...`);
    const gRes = await fetch(`${baseUrl}/games`, { headers: { 'x-api-key': key } });
    const gData = await gRes.json();
    const gList = gData.data || [];

    // Log all game IDs/Names
    gList.forEach(g => console.log(`- ${g.id} (${g.name})`));

    const jpGame = gList.find(g => g.name === 'Pokemon Japan');
    if (!jpGame) {
        console.log("Pokemon Japan not found in games list.");
        return;
    }
    const gameId = jpGame.id;
    console.log(`\nFound ID: ${gameId}`);

    console.log(`fetching sets for ${gameId}...`);
    try {
        const res = await fetch(`${baseUrl}/games/${gameId}/sets`, {
            headers: { 'x-api-key': key }
        });

        if (!res.ok) {
            console.log("Sets Error:", res.status, await res.text());

            // Maybe ID is diff?
            const gRes = await fetch(`${baseUrl}/games`, { headers: { 'x-api-key': key } });
            const gData = await gRes.json();
            const jpGame = gData.data.find(g => g.name === 'Pokemon Japan');
            if (jpGame) {
                console.log(`True JP Game ID: ${jpGame.id}`);
                // Try again with correct ID
                const res2 = await fetch(`${baseUrl}/games/${jpGame.id}/sets`, { headers: { 'x-api-key': key } });
                const data2 = await res2.json();
                printSets(data2.data);
            }
            return;
        }

        const data = await res.json();
        printSets(data.data);

    } catch (e) { console.error(e); }
}

function printSets(sets) {
    if (!sets) return;
    console.log(`Found ${sets.length} JP sets.`);
    if (sets.length > 0) {
        console.log("Sample Set:", JSON.stringify(sets[0], null, 2));

        // Search for sv4a
        const sv4a = sets.find(s => s.code === 'sv4a' || s.name.includes('Shiny Treasure'));
        if (sv4a) console.log("Found sv4a:", sv4a);
        else console.log("sv4a not found by code/name.");
    }
}

testJustTCGJapan();
