import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debugEndpoints() {
    const key = process.env.JUSTTCG_API_KEY;
    const baseUrl = 'https://api.justtcg.com/v1';

    const tryFetch = async (url) => {
        console.log(`Fetching ${url}...`);
        try {
            const res = await fetch(url, { headers: { 'x-api-key': key } });
            if (!res.ok) {
                console.log(`  Err: ${res.status}`);
                return;
            }
            const json = await res.json();
            const data = json.data || (Array.isArray(json) ? json : []);
            if (data.length > 0) {
                console.log(`  Success! Found ${data.length} items.`);
                console.log(`  Sample: ID=${data[0].id}, Name=${data[0].name}`);
            } else {
                console.log(`  Empty list or different structure.`);
                console.log(`  Keys: ${Object.keys(json).join(', ')}`);
            }
        } catch (e) { console.log(`  Exception: ${e.message}`); }
    };

    // 1. Pokemon (English) Sets via games/{id}/sets
    await tryFetch(`${baseUrl}/games/pokemon/sets`);

    // 2. Pokemon Japan Sets via games/{id}/sets
    await tryFetch(`${baseUrl}/games/pokemon-japan/sets`);

    // 3. /sets Endpoint?
    await tryFetch(`${baseUrl}/sets?gameId=pokemon-japan`);
    await tryFetch(`${baseUrl}/sets?game=pokemon-japan`);

    // 4. /categories?
    await tryFetch(`${baseUrl}/categories?gameId=pokemon-japan`);

}
debugEndpoints();
