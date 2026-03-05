import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkPaging() {
    const key = process.env.JUSTTCG_API_KEY;
    const baseUrl = 'https://api.justtcg.com/v1';

    // Check sv4a (id: sv4a-shiny-treasure-ex-pokemon-japan)
    const setId = 'sv4a-shiny-treasure-ex-pokemon-japan';
    const url = `${baseUrl}/cards?game=pokemon-japan&set_id=${setId}`;

    console.log(`Fetching ${url}...`);
    const res = await fetch(url, { headers: { 'x-api-key': key } });
    const json = await res.json();

    console.log("Keys:", Object.keys(json));
    if (json.meta) console.log("Meta:", json.meta);
    if (json.data) console.log("Data Length:", json.data.length);

    // Check if pages exist
}
checkPaging();
