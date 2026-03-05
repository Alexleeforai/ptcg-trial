import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testJustTCG() {
    const key = process.env.JUSTTCG_API_KEY;
    const baseUrl = 'https://api.justtcg.com/v1';

    console.log("Testing JustTCG vs TCGdex...");
    console.log("Key:", key ? "Present" : "Missing");

    // 1. Get Games
    console.log(`\nfetching ${baseUrl}/games ...`);
    try {
        const res = await fetch(`${baseUrl}/games`, {
            headers: { 'x-api-key': key }
        });
        if (!res.ok) {
            console.log("Games Error:", res.status, await res.text());
            return;
        }
        const games = await res.json();
        console.log("Raw Response:", JSON.stringify(games, null, 2).substring(0, 500));
        const list = Array.isArray(games) ? games : (games.data || []);
        console.log("Games Found:", list.map(g => g.name || g.id));

        // Find Pokemon
        const pokemon = list.find(g => g.name.toLowerCase().includes('pokemon'));
        if (!pokemon) {
            console.log("Pokemon game not found in response.");
            return;
        }
        const gameId = pokemon.id;
        console.log(`Pokemon Game ID: ${gameId}`);

        // 2. Get Sets
        console.log(`\nfetching sets for game ${gameId}...`);
        const setRes = await fetch(`${baseUrl}/games/${gameId}/sets`, {
            headers: { 'x-api-key': key }
        });
        const sets = await setRes.json(); // Likely array or { data: [] }
        const setList = Array.isArray(sets) ? sets : (sets.data || []);

        console.log(`Found ${setList.length} sets.`);
        if (setList.length > 0) {
            console.log("Sample Set:", JSON.stringify(setList[0], null, 2));

            // Check for Japanese sets (sv4a, s8a)
            // JustTCG sets usually follow TCGplayer names e.g. "Scarlet & Violet: Paldean Fates"
            // Start check
            const jp1 = setList.find(s => s.name.includes('Shiny Treasure'));
            const jp2 = setList.find(s => s.code === 'sv4a' || s.code === 'SV4a');
            const jp3 = setList.find(s => s.name && /Japanese/.test(s.name));

            if (jp1 || jp2 || jp3) {
                console.log("Potential JP Set found:", jp1 || jp2 || jp3);
            } else {
                console.log("No obvious Japanese sets found (JustTCG is likely English only).");
            }
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testJustTCG();
